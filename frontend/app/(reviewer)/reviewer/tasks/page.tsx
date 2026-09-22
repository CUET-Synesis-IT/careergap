"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "@/lib/api/review.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Hash,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function ReviewerTasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(
    null,
  );

  const tasksQuery = useQuery({
    queryKey: ["review-tasks"],
    queryFn: reviewApi.getTasks,
  });

  const claim = useMutation({
    mutationFn: (taskId: string) => reviewApi.claimTask(taskId),
    onSuccess: async (task) => {
      setClaimErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      router.push(`/reviewer/tasks/${task.id}`);
    },
    onError: async (error: unknown) => {
      if (
        error instanceof ApiError &&
        (error.status === 409 || error.code === "REVIEW_TASK_LOCKED")
      ) {
        setClaimErrorMessage(
          "This task has already been claimed by another reviewer.",
        );
      } else if (error instanceof ApiError) {
        setClaimErrorMessage(error.message || "Unable to claim this task.");
      } else {
        setClaimErrorMessage("Unable to claim this task. Please try again.");
      }

      // Re-fetch the review queue so the list is refreshed with current availability
      await queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
    },
  });

  const handleRefresh = () => {
    setClaimErrorMessage(null);
    tasksQuery.refetch();
  };

  const tasks = tasksQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Review Queue
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review AI-generated career analyses and verify their results.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={tasksQuery.isFetching}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:self-auto"
          title="Refresh task queue"
        >
          <RefreshCw
            className={`h-4 w-4 ${tasksQuery.isFetching ? "animate-spin text-zinc-900 dark:text-zinc-100" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Claim Conflict / Error Alert */}
      {claimErrorMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-semibold">Unable to claim task</p>
              <p className="mt-0.5">{claimErrorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setClaimErrorMessage(null)}
            className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
            title="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {tasksQuery.isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Loading review tasks...
          </p>
        </div>
      )}

      {/* Query Error State */}
      {tasksQuery.isError && !tasksQuery.isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mx-auto h-7 w-7 text-red-600 dark:text-red-400" />
          <p className="mt-2 font-semibold">Unable to load review tasks</p>
          <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
            {tasksQuery.error instanceof ApiError
              ? tasksQuery.error.message
              : "Failed to connect to the server."}
          </p>
          <button
            onClick={() => tasksQuery.refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No review tasks are currently available.
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            All pending career analyses have either been verified or claimed.
            Check back shortly.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Queue
          </button>
        </div>
      )}

      {/* Tasks Grid */}
      {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {tasks.map((task) => {
            const isThisTaskClaiming =
              claim.isPending && claim.variables === task.id;
            const isMyLockedTask =
              task.status === "LOCKED" &&
              Boolean(user?.id) &&
              task.lockedById === user?.id;
            const matchPercentage = task.analysis.aiResult?.matchPercentage;
            const matchedSkillsCount =
              task.analysis.aiResult?.matchedSkills?.length ?? 0;
            const missingSkillsCount =
              task.analysis.aiResult?.missingSkills?.length ?? 0;
            return (
              <article
                key={task.id}
                className={`flex flex-col justify-between rounded-xl border p-5 shadow-xs transition ${
                  isMyLockedTask
                    ? "border-amber-300 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/20"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                }`}
              >
                <div>
                  {/* Career & Status Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                        <Briefcase className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                        <span className="truncate">
                          {task.analysis.career.name}
                        </span>
                      </p>
                      {task.analysis.career.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {task.analysis.career.description}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    {task.status === "OPEN" ? (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                        OPEN
                      </span>
                    ) : isMyLockedTask ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:border-amber-900/80 dark:bg-amber-950/80 dark:text-amber-200">
                        <ShieldCheck className="h-3 w-3" />
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {task.status}
                      </span>
                    )}
                  </div>

                  {/* Metadata Row: Analysis ID & Submission Time */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
                      <Hash className="h-3 w-3" />
                      Analysis: #
                      {task.analysisId
                        ? task.analysisId.slice(0, 8)
                        : task.analysis.id.slice(0, 8)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted {formatDate(task.createdAt)}
                    </span>
                  </div>

                  {/* AI Result Summary */}
                  <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800/80 dark:bg-zinc-950/50">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        AI match:
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {matchPercentage !== null &&
                        matchPercentage !== undefined
                          ? `${matchPercentage.toFixed(2)}%`
                          : "Pending calculation"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>{matchedSkillsCount} matched</span>
                      <span>•</span>
                      <span>{missingSkillsCount} missing</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-5">
                  <button
                    onClick={() => {
                      setClaimErrorMessage(null);
                      claim.mutate(task.id);
                    }}
                    disabled={claim.isPending}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isMyLockedTask
                        ? "bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    }`}
                  >
                    {isThisTaskClaiming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading task…
                      </>
                    ) : isMyLockedTask ? (
                      <>
                        <span>Resume Review</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Review Task</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
