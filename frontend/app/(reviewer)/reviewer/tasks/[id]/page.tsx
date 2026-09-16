"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "@/lib/api/review.api";
import { ApiError } from "@/lib/api/client";
import type { ReviewTask } from "@/lib/api/types";
import { AlertCircle, Loader2 } from "lucide-react";

export default function ReviewTaskPage() {
  const { id } = useParams<{ id: string }>();
  const taskQuery = useQuery({
    queryKey: ["review-tasks", id],
    queryFn: () => reviewApi.getTask(id),
    enabled: Boolean(id),
  });
  if (taskQuery.isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (taskQuery.isError || !taskQuery.data)
    return (
      <ErrorBox
        message={
          taskQuery.error instanceof ApiError
            ? taskQuery.error.message
            : "Unable to load this task."
        }
      />
    );
  return <ReviewForm task={taskQuery.data} />;
}

function ReviewForm({ task }: { task: ReviewTask }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initial = task.analysis.aiResult;
  const [score, setScore] = useState(initial?.matchPercentage ?? 0);
  const [matched, setMatched] = useState(
    initial?.matchedSkills.join(", ") ?? "",
  );
  const [missing, setMissing] = useState(
    initial?.missingSkills.join(", ") ?? "",
  );
  const [comment, setComment] = useState("");
  const submit = useMutation({
    mutationFn: () =>
      reviewApi.submitReview(task.id, {
        finalMatchPercentage: score,
        finalMatchedSkills: toSkills(matched),
        finalMissingSkills: toSkills(missing),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      router.push("/reviewer/tasks");
    },
  });
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Review: {task.analysis.career.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lock expires{" "}
          {task.lockExpiresAt
            ? new Date(task.lockExpiresAt).toLocaleString()
            : "—"}
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        The current backend task response does not include resume text. Verify
        and correct the AI result below using the data currently exposed by the
        API.
      </div>
      <section className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm font-semibold">
          Final match percentage
        </label>
        <input
          type="number"
          min={0}
          max={100}
          step="any"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="mt-2 w-32 rounded-lg border bg-transparent px-3 py-2"
          required
        />
        <label className="mt-5 block text-sm font-semibold">
          Matched skills{" "}
          <span className="font-normal text-zinc-500">(comma separated)</span>
        </label>
        <textarea
          value={matched}
          onChange={(e) => setMatched(e.target.value)}
          className="mt-2 min-h-24 w-full rounded-lg border bg-transparent p-3"
        />
        <label className="mt-5 block text-sm font-semibold">
          Missing skills{" "}
          <span className="font-normal text-zinc-500">(comma separated)</span>
        </label>
        <textarea
          value={missing}
          onChange={(e) => setMissing(e.target.value)}
          className="mt-2 min-h-24 w-full rounded-lg border bg-transparent p-3"
        />
        <label className="mt-5 block text-sm font-semibold">
          Reviewer comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          className="mt-2 min-h-24 w-full rounded-lg border bg-transparent p-3"
        />
      </section>
      {submit.error && (
        <ErrorBox
          message={
            submit.error instanceof ApiError
              ? submit.error.message
              : "Unable to submit this review."
          }
        />
      )}
      <button
        disabled={submit.isPending}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {submit.isPending ? "Submitting…" : "Submit verified result"}
      </button>
    </form>
  );
}

function toSkills(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  ];
}
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="mr-2 inline h-4 w-4" />
      {message}
    </div>
  );
}
