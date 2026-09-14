import type { CareerSkill } from "../types/career";
import { normalizeSkill } from "../utils/skill-normalizer";

export interface AnalysisScore {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function calculateSkillMatch(
  userSkills: string[],
  careerSkills: CareerSkill[],
): AnalysisScore {
  const normalizedUserSkills = new Set(
    userSkills
      .map(normalizeSkill)
      .filter(Boolean)
      .map(toComparisonKey),
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const careerSkill of careerSkills) {
    const canonicalName = normalizeSkill(careerSkill.name);
    const comparisonKey = toComparisonKey(canonicalName);

    if (normalizedUserSkills.has(comparisonKey)) {
      matchedSkills.push(canonicalName);
    } else {
      missingSkills.push(canonicalName);
    }
  }

  const totalRequiredSkills = careerSkills.length;

  const matchPercentage =
    totalRequiredSkills === 0
      ? 0
      : roundToTwoDecimals(
          (matchedSkills.length / totalRequiredSkills) * 100,
        );

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
  };
}

function toComparisonKey(skill: string): string {
  return skill
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
