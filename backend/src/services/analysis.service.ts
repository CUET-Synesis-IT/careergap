import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { getAIProvider } from "../ai/provider.factory";
import { normalizeSkills } from "../utils/skill-normalizer";
import { calculateSkillMatch } from "./scoring.service";
import { resolveCareerProfile } from "./career-profile.service";
import type { AnalysisResponse } from "../types/analysis";

const analysisResponseSelect = {
  id: true,
  status: true,
  resumeId: true,
  careerId: true,
  extractedSkills: true,
  aiMatchPercentage: true,
  aiMatchedSkills: true,
  aiMissingSkills: true,
  finalMatchPercentage: true,
  finalMatchedSkills: true,
  finalMissingSkills: true,
  createdAt: true,
  updatedAt: true,
  career: {
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      profile: true,
    },
  },
} as const;

const ACTIVE_ANALYSIS_STATUSES = ["PENDING", "PROCESSING", "REVIEW"] as const;

function toAnalysisResponse(analysis: {
  id: string;
  status: string;
  resumeId: string;
  careerId: string;
  extractedSkills: unknown;
  aiMatchPercentage: number | null;
  aiMatchedSkills: unknown;
  aiMissingSkills: unknown;
  finalMatchPercentage: number | null;
  finalMatchedSkills: unknown;
  finalMissingSkills: unknown;
  createdAt: Date;
  updatedAt: Date;
  career: {
    id: string;
    slug: string;
    name: string;
    description: string;
    profile?: unknown;
  };
}): AnalysisResponse {
  const aiResult =
    analysis.aiMatchPercentage !== null
      ? {
          matchPercentage: analysis.aiMatchPercentage,
          matchedSkills: extractSkillArray(analysis.aiMatchedSkills),
          missingSkills: extractSkillArray(analysis.aiMissingSkills),
        }
      : null;

  const finalResult =
    analysis.finalMatchPercentage !== null
      ? {
          matchPercentage: analysis.finalMatchPercentage,
          matchedSkills: extractSkillArray(analysis.finalMatchedSkills),
          missingSkills: extractSkillArray(analysis.finalMissingSkills),
        }
      : null;

  return {
    id: analysis.id,
    status: analysis.status as AnalysisResponse["status"],
    resumeId: analysis.resumeId,
    careerId: analysis.careerId,
    career: analysis.career,
    extractedSkills: extractRawStringSkills(analysis.extractedSkills),
    aiResult,
    finalResult,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
}

function extractSkillArray(
  value: unknown,
): (string | { name: string; importance?: string })[] {
  if (
    typeof value === "object" &&
    value !== null &&
    "skills" in value &&
    Array.isArray(value.skills)
  ) {
    return value.skills
      .map((skill) => {
        if (typeof skill === "string") return skill;
        if (typeof skill === "object" && skill !== null && "name" in skill) {
          return {
            name: String(skill.name),
            ...("importance" in skill && skill.importance
              ? { importance: String(skill.importance) }
              : {}),
          };
        }
        return null;
      })
      .filter(
        (item): item is string | { name: string; importance?: string } =>
          item !== null,
      );
  }

  return [];
}

function extractRawStringSkills(value: unknown): string[] {
  if (
    typeof value === "object" &&
    value !== null &&
    "skills" in value &&
    Array.isArray(value.skills)
  ) {
    return value.skills.filter(
      (skill): skill is string => typeof skill === "string",
    );
  }

  return [];
}

export async function createAnalysis(
  userId: string,
  resumeId: string,
  careerId: string,
): Promise<AnalysisResponse> {
  // ------------------------------------------
  // 1. Validate resume ownership
  // ------------------------------------------

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId,
    },
    select: {
      id: true,
      text: true,
    },
  });

  if (!resume) {
    throw new AppError("Resume not found.", 404, "RESUME_NOT_FOUND");
  }

  // ------------------------------------------
  // 2. Validate career
  // ------------------------------------------

  const career = await prisma.career.findUnique({
    where: {
      id: careerId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      profile: true,
    },
  });

  if (!career) {
    throw new AppError("Career not found.", 404, "CAREER_NOT_FOUND");
  }

  // ------------------------------------------
  // 3. Prevent duplicate active analysis
  // ------------------------------------------

  const existingAnalysis = await prisma.analysis.findFirst({
    where: {
      userId,
      resumeId,
      careerId,
      status: {
        in: [...ACTIVE_ANALYSIS_STATUSES],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  if (existingAnalysis) {
    throw new AppError(
      "An active analysis already exists for this resume and career.",
      409,
      "DUPLICATE_ANALYSIS",
    );
  }

  // ------------------------------------------
  // 4. Create PENDING analysis
  // ------------------------------------------

  const analysis = await prisma.analysis.create({
    data: {
      userId,
      resumeId,
      careerId,
      extractedSkills: {
        skills: [],
      },
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  try {
    // ----------------------------------------
    // 5. PENDING → PROCESSING
    // ----------------------------------------

    await prisma.analysis.update({
      where: {
        id: analysis.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    // ----------------------------------------
    // 6. One LLM call for resume skills
    // ----------------------------------------

    const provider = getAIProvider();

    const extracted = await provider.extractResumeSkills({
      resumeText: resume.text,
    });

    // ----------------------------------------
    // 7. Normalize + deduplicate skills
    // ----------------------------------------

    const normalizedSkills = normalizeSkills(extracted.skills);

    // ----------------------------------------
    // 8. Resolve career profile
    //
    // Career object already contains slug,
    // so no extra DB query is needed merely
    // to discover the slug.
    // ----------------------------------------

    const careerProfile = await resolveCareerProfile(career);

    // ----------------------------------------
    // 9. Deterministic matching
    // ----------------------------------------

    const score = calculateSkillMatch(normalizedSkills, careerProfile.skills);

    // ----------------------------------------
    // 10. Save AI result
    // ----------------------------------------

    await prisma.analysis.update({
      where: {
        id: analysis.id,
      },
      data: {
        extractedSkills: {
          skills: normalizedSkills,
        },
        aiMatchPercentage: score.matchPercentage,
        aiMatchedSkills: {
          skills: score.matchedSkills,
        },
        aiMissingSkills: {
          skills: score.missingSkills,
        },
      },
    });

    // ----------------------------------------
    // 11. Create review task + move to REVIEW
    //
    // Both belong together logically, so use
    // one short DB transaction.
    // ----------------------------------------

    await prisma.$transaction([
      prisma.reviewTask.create({
        data: {
          analysisId: analysis.id,
          status: "OPEN",
        },
      }),

      prisma.analysis.update({
        where: {
          id: analysis.id,
        },
        data: {
          status: "REVIEW",
        },
      }),
    ]);
  } catch (error) {
    // ----------------------------------------
    // 12. Any processing failure → FAILED
    // ----------------------------------------

    await prisma.analysis.update({
      where: {
        id: analysis.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }

  // ------------------------------------------
  // 13. Return complete analysis
  // ------------------------------------------

  const completed = await prisma.analysis.findUnique({
    where: {
      id: analysis.id,
    },
    select: analysisResponseSelect,
  });

  if (!completed) {
    throw new AppError(
      "Analysis could not be loaded.",
      500,
      "ANALYSIS_LOAD_FAILED",
    );
  }

  return toAnalysisResponse(completed);
}

export async function getAnalysisById(
  userId: string,
  analysisId: string,
): Promise<AnalysisResponse> {
  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      userId,
    },
    select: analysisResponseSelect,
  });

  if (!analysis) {
    throw new AppError("Analysis not found.", 404, "ANALYSIS_NOT_FOUND");
  }

  return toAnalysisResponse(analysis);
}

export async function getUserAnalyses(
  userId: string,
): Promise<AnalysisResponse[]> {
  const analyses = await prisma.analysis.findMany({
    where: {
      userId,
    },
    select: analysisResponseSelect,
    orderBy: {
      createdAt: "desc",
    },
  });

  return analyses.map(toAnalysisResponse);
}
