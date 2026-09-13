import crypto from "node:crypto";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { extractResumeText } from "../utils/resume-text";

export interface ResumeResponse {
  id: string;
  fileName: string;
  createdAt: Date;
}

const resumeSelect = {
  id: true,
  fileName: true,
  createdAt: true,
} as const;

export async function createResume(
  userId: string,
  fileName: string,
  buffer: Buffer,
): Promise<ResumeResponse> {
  const text = await extractResumeText(buffer);

  const textHash = crypto
    .createHash("sha256")
    .update(text, "utf8")
    .digest("hex");

  const resume = await prisma.resume.create({
    data: {
      userId,
      fileName,
      text,
      textHash,
    },
    select: resumeSelect,
  });

  return resume;
}

export async function getResumeById(
  userId: string,
  resumeId: string,
): Promise<ResumeResponse> {
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId,
    },
    select: resumeSelect,
  });

  if (!resume) {
    throw new AppError(
      "Resume not found.",
      404,
      "RESUME_NOT_FOUND",
    );
  }

  return resume;
}
