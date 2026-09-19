"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "@/lib/api/review.api";
import { ApiError } from "@/lib/api/client";
import type { ReviewTask } from "@/lib/api/types";
import { SkillsTagInput } from "./skills-tag-input";
import {
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Loader2,
  RotateCcw,
} from "lucide-react";

const correctionSchema = z.object({
  finalMatchPercentage: z.coerce
    .number({ invalid_type_error: "Please enter a valid number" })
    .min(0, "Match percentage must be at least 0%")
    .max(100, "Match percentage cannot exceed 100%"),
  finalMatchedSkills: z
    .array(z.string().trim().min(1, "Skill name cannot be empty"))
    .max(100, "Too many matched skills"),
  finalMissingSkills: z
    .array(z.string().trim().min(1, "Skill name cannot be empty"))
    .max(100, "Too many missing skills"),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment cannot exceed 2000 characters")
    .optional(),
});

type CorrectionFormData = z.infer<typeof correctionSchema>;

interface ReviewCorrectionFormProps {
  task: ReviewTask;
  isTimerExpired?: boolean;
}

export function ReviewCorrectionForm({
  task,
  isTimerExpired = false,
}: ReviewCorrectionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [submitError, setSubmitError] = useState<{
    isExpired: boolean;
    message: string;
  } | null>(null);

  const initialAi = task.analysis.aiResult;
  const initialValues: CorrectionFormData = {
    finalMatchPercentage: initialAi?.matchPercentage ?? 0,
    finalMatchedSkills: initialAi?.matchedSkills ?? [],
    finalMissingSkills: initialAi?.missingSkills ?? [],
    comment: "",
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionSchema),
    defaultValues: initialValues,
  });

  const submitMutation = useMutation({
    mutationFn: (data: CorrectionFormData) =>
      reviewApi.submitReview(task.id, {
        finalMatchPercentage: data.finalMatchPercentage,
        finalMatchedSkills: data.finalMatchedSkills,
        finalMissingSkills: data.finalMissingSkills,
        ...(data.comment?.trim() ? { comment: data.comment.trim() } : {}),
      }),
    onSuccess: async () => {
      setSubmitError(null);
      await queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      router.push("/reviewer/tasks");
    },
    onError: (err: unknown) => {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        (err.code === "REVIEW_LOCK_EXPIRED" ||
          err.code === "REVIEW_TASK_LOCK_EXPIRED" ||
          err.message.toLowerCase().includes("expired"))
      ) {
        setSubmitError({
          isExpired: true,
          message:
            "Your review lock has expired. Please return to the queue and claim the task again.",
        });
      } else if (err instanceof ApiError) {
        setSubmitError({
          isExpired: false,
          message: err.message || "Unable to submit review. Please try again.",
        });
      } else {
        setSubmitError({
          isExpired: false,
          message: "An unexpected error occurred. Please try again.",
        });
      }
    },
  });

  const onSubmit = (data: CorrectionFormData) => {
    if (isTimerExpired) return;
    setSubmitError(null);
    submitMutation.mutate(data);
  };

  const handleResetToAi = () => {
    reset(initialValues);
    setSubmitError(null);
  };

  const isDisabled = submitMutation.isPending || isTimerExpired;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Form Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-zinc-100 p-2 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            <FileEdit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-lg">
              Human Reviewer Decision
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pre-filled with AI recommendations. Correct or update the final
              evaluation below.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToAi}
          disabled={isDisabled}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 sm:self-auto"
          title="Reset values to original AI result"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to AI baseline
        </button>
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            submitError.isExpired
              ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {submitError.isExpired
                  ? "Review Lock Expired"
                  : "Submission Failed"}
              </p>
              <p className="mt-0.5 text-xs">{submitError.message}</p>
            </div>
          </div>

          {submitError.isExpired && (
            <Link
              href="/reviewer/tasks"
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              Return to Queue
            </Link>
          )}
        </div>
      )}

      {/* Timer Expired Warning */}
      {isTimerExpired && !submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>
            Lock expired: You can no longer submit this review. Please return to
            the queue to reclaim the task.
          </span>
        </div>
      )}

      {/* Final Match Percentage Input */}
      <div>
        <label
          htmlFor="finalMatchPercentage"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Final Verified Match Percentage (0 – 100)
        </label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          The verified percentage match score between candidate profile and
          career requirements.
        </p>

        <div className="mt-2 flex items-center gap-2">
          <input
            id="finalMatchPercentage"
            type="number"
            step="any"
            min="0"
            max="100"
            disabled={isDisabled}
            {...register("finalMatchPercentage")}
            className="w-32 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-2xs outline-none transition focus:border-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          />
          <span className="font-semibold text-zinc-500">%</span>
        </div>
        {errors.finalMatchPercentage && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.finalMatchPercentage.message}
          </p>
        )}
      </div>

      {/* Matched Skills Tag Input */}
      <Controller
        control={control}
        name="finalMatchedSkills"
        render={({ field }) => (
          <SkillsTagInput
            label="Final Matched Skills"
            description="Skills verified to be present in the candidate's experience."
            skills={field.value}
            onChange={field.onChange}
            variant="emerald"
            disabled={isDisabled}
            errorMessage={errors.finalMatchedSkills?.message}
          />
        )}
      />

      {/* Missing Skills Tag Input */}
      <Controller
        control={control}
        name="finalMissingSkills"
        render={({ field }) => (
          <SkillsTagInput
            label="Final Missing Skills"
            description="Target skills that remain unfulfilled or absent from the candidate's background."
            skills={field.value}
            onChange={field.onChange}
            variant="rose"
            disabled={isDisabled}
            errorMessage={errors.finalMissingSkills?.message}
          />
        )}
      />

      {/* Reviewer Comment */}
      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Reviewer Notes & Feedback{" "}
          <span className="font-normal text-zinc-500">(Optional)</span>
        </label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Provide any context or justification for adjustments made to the AI
          evaluation (max 2,000 chars).
        </p>

        <textarea
          id="comment"
          rows={3}
          maxLength={2000}
          disabled={isDisabled}
          placeholder="e.g. Added Docker as experience demonstrated container orchestration not detected in initial parse."
          {...register("comment")}
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-2xs outline-none transition focus:border-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
        />
        {errors.comment && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.comment.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/reviewer/tasks"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting review…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Final Review</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
