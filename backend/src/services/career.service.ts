import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type { CareerResponse } from "../types/career";

const careerSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
} as const;

export async function getCareers(): Promise<CareerResponse[]> {
  return prisma.career.findMany({
    select: careerSelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCareerById(
  careerId: string,
): Promise<CareerResponse> {
  const career = await prisma.career.findUnique({
    where: {
      id: careerId,
    },
    select: careerSelect,
  });

  if (!career) {
    throw new AppError(
      "Career not found.",
      404,
      "CAREER_NOT_FOUND",
    );
  }

  return career;
}
