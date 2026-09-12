-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'REVIEWER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'REVIEW', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewTaskStatus" AS ENUM ('OPEN', 'LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SkillImportance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "profile" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "extractedSkills" JSONB NOT NULL,
    "aiMatchPercentage" DOUBLE PRECISION,
    "aiMatchedSkills" JSONB,
    "aiMissingSkills" JSONB,
    "finalMatchPercentage" DOUBLE PRECISION,
    "finalMatchedSkills" JSONB,
    "finalMissingSkills" JSONB,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTask" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "status" "ReviewTaskStatus" NOT NULL DEFAULT 'OPEN',
    "lockedById" TEXT,
    "lockExpiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reviewTaskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "originalMatchPercentage" DOUBLE PRECISION,
    "originalMatchedSkills" JSONB,
    "originalMissingSkills" JSONB,
    "finalMatchPercentage" DOUBLE PRECISION NOT NULL,
    "finalMatchedSkills" JSONB NOT NULL,
    "finalMissingSkills" JSONB NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Career_slug_key" ON "Career"("slug");

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- CreateIndex
CREATE INDEX "Resume_textHash_idx" ON "Resume"("textHash");

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_resumeId_idx" ON "Analysis"("resumeId");

-- CreateIndex
CREATE INDEX "Analysis_careerId_idx" ON "Analysis"("careerId");

-- CreateIndex
CREATE INDEX "Analysis_status_idx" ON "Analysis"("status");

-- CreateIndex
CREATE INDEX "Analysis_userId_status_idx" ON "Analysis"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTask_analysisId_key" ON "ReviewTask"("analysisId");

-- CreateIndex
CREATE INDEX "ReviewTask_status_idx" ON "ReviewTask"("status");

-- CreateIndex
CREATE INDEX "ReviewTask_lockedById_idx" ON "ReviewTask"("lockedById");

-- CreateIndex
CREATE INDEX "ReviewTask_lockExpiresAt_idx" ON "ReviewTask"("lockExpiresAt");

-- CreateIndex
CREATE INDEX "ReviewTask_status_lockExpiresAt_idx" ON "ReviewTask"("status", "lockExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewTaskId_key" ON "Review"("reviewTaskId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTask" ADD CONSTRAINT "ReviewTask_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTask" ADD CONSTRAINT "ReviewTask_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewTaskId_fkey" FOREIGN KEY ("reviewTaskId") REFERENCES "ReviewTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
