"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "@/lib/api/review.api";
import { ApiError } from "@/lib/api/client";
import { AlertCircle, Briefcase, Loader2 } from "lucide-react";

export default function ReviewerTasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["review-tasks"],
    queryFn: reviewApi.getTasks,
  });
  const claim = useMutation({
    mutationFn: reviewApi.claimTask,
    onSuccess: async (task) => {
      await queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      router.push(`/reviewer/tasks/${task.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Review Task Queue
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Open analyses available for human verification.
        </p>
      </div>
      {tasksQuery.isLoading && (
        <div className="flex justify-center p-16">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      )}
      {tasksQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          Unable to load review tasks.
        </div>
      )}
      {claim.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {claim.error instanceof ApiError
            ? claim.error.message
            : "Unable to claim this task."}
        </div>
      )}
      {tasksQuery.data?.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
          No review tasks are currently available.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {tasksQuery.data?.map((task) => (
          <article
            key={task.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <Briefcase className="h-4 w-4" />
                  {task.analysis.career.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Submitted {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                {task.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              AI match:{" "}
              {task.analysis.aiResult?.matchPercentage != null
                ? task.analysis.aiResult.matchPercentage.toFixed(1)
                : "—"}
              %
            </p>
            <button
              onClick={() => claim.mutate(task.id)}
              disabled={claim.isPending}
              className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {claim.isPending && claim.variables === task.id
                ? "Claiming…"
                : "Claim and review"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
