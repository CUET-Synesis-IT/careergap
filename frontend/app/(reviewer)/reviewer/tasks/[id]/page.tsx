"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reviewApi } from "@/lib/api/review.api";
import { ApiError } from "@/lib/api/client";
import { LockCountdownTimer } from "@/components/reviewer/lock-countdown-timer";
import { AiReferenceSection } from "@/components/reviewer/ai-reference-section";
import { ReviewCorrectionForm } from "@/components/reviewer/review-correction-form";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Hash,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function ReviewTaskDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  const taskQuery = useQuery({
    queryKey: ["review-tasks", id],
    queryFn: () => reviewApi.getTask(id),
    enabled: Boolean(id),
  });

  if (taskQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Loading review task...
        </p>
      </div>
    );
  }

  // Conflict / Locked by another reviewer
  if (
    taskQuery.isError &&
    taskQuery.error instanceof ApiError &&
    (taskQuery.error.status === 409 ||
      taskQuery.error.code === "REVIEW_TASK_LOCKED")
  ) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <h2 className="mt-3 text-lg font-bold">
          Task Locked by Another Reviewer
        </h2>
        <p className="mt-1.5 text-sm text-amber-800 dark:text-amber-300">
          This task is currently being reviewed by another reviewer.
        </p>
        <div className="mt-6">
          <Link
            href="/reviewer/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 transition dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Review Queue
          </Link>
        </div>
      </div>
    );
  }

  // Already completed task
  if (
    taskQuery.isError &&
    taskQuery.error instanceof ApiError &&
    taskQuery.error.code === "REVIEW_TASK_COMPLETED"
  ) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-blue-200 bg-blue-50 p-8 text-center text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
        <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600 dark:text-blue-400" />
        <h2 className="mt-3 text-lg font-bold">Review Already Completed</h2>
        <p className="mt-1.5 text-sm text-blue-800 dark:text-blue-300">
          This review has already been verified and completed.
        </p>
        <div className="mt-6">
          <Link
            href="/reviewer/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Review Queue
          </Link>
        </div>
      </div>
    );
  }

  // Generic Error
  if (taskQuery.isError || !taskQuery.data) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
        <h2 className="mt-3 text-lg font-bold">Unable to Load Review Task</h2>
        <p className="mt-1.5 text-sm text-red-800 dark:text-red-300">
          {taskQuery.error instanceof ApiError
            ? taskQuery.error.message
            : "Review task not found or unavailable."}
        </p>
        <div className="mt-6">
          <Link
            href="/reviewer/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition dark:bg-red-700 dark:hover:bg-red-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Review Queue
          </Link>
        </div>
      </div>
    );
  }

  const task = taskQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/reviewer/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Review Queue</span>
        </Link>
      </div>

      {/* Task Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Review: {task.analysis.career.name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              {task.status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
              <Hash className="h-3 w-3" />
              Analysis: #
              {task.analysisId
                ? task.analysisId.slice(0, 8)
                : task.analysis.id.slice(0, 8)}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
              <Hash className="h-3 w-3" />
              Task: #{task.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Countdown Timer (UI Aid) */}
      <LockCountdownTimer
        lockExpiresAt={task.lockExpiresAt}
        onExpire={() => setIsTimerExpired(true)}
      />

      {/* Target Career Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Target Career: {task.analysis.career.name}
            </h2>
            {task.analysis.career.description && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {task.analysis.career.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Result Section (Read-Only Reference) */}
      <AiReferenceSection
        aiResult={task.analysis.aiResult}
        extractedSkills={task.analysis.extractedSkills}
        career={task.analysis.career}
      />

      {/* Reviewer Correction Form */}
      <ReviewCorrectionForm task={task} isTimerExpired={isTimerExpired} />
    </div>
  );
}
