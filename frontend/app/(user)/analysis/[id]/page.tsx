"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { analysisApi } from "@/lib/api/analysis.api";
import type { AnalysisStatus } from "@/lib/api/types";
import { AiResultSection } from "@/components/analysis/ai-result-section";
import { FinalResultSection } from "@/components/analysis/final-result-section";
import {
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowLeft,
  RotateCw,
  FileCode2,
} from "lucide-react";

const STATUS_CONFIG: Record<
  AnalysisStatus,
  {
    label: string;
    description: string;
    subtext: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "Waiting to start",
    description: "Preparing your analysis...",
    subtext:
      "Your resume is queued for automated AI analysis. Processing will begin shortly.",
    badgeClass:
      "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    icon: Clock,
  },
  PROCESSING: {
    label: "Analyzing resume",
    description: "AI is analyzing your resume...",
    subtext:
      "The AI model is currently extracting skills and calculating matches against the career profile. No action needed.",
    badgeClass:
      "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    icon: Loader2,
  },
  REVIEW: {
    label: "Waiting for human review",
    description: "Your analysis is waiting for human verification.",
    subtext:
      "The initial AI assessment is ready. An expert reviewer will verify the results before final completion.",
    badgeClass:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Hourglass,
  },
  COMPLETED: {
    label: "Analysis completed",
    description: "Analysis completed.",
    subtext:
      "This analysis has been reviewed and approved by a verified reviewer.",
    badgeClass:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Analysis failed",
    description: "Analysis failed. Please try again.",
    subtext: "We encountered an error while processing this analysis.",
    badgeClass:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    icon: AlertCircle,
  },
};

export default function AnalysisDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const {
    data: analysis,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analyses", id],
    queryFn: () => analysisApi.getById(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while in intermediate states; stop polling on COMPLETED or FAILED
      if (
        status === "PENDING" ||
        status === "PROCESSING" ||
        status === "REVIEW"
      ) {
        return 2500;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Loading analysis details...
        </p>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
            <div className="space-y-2 flex-1">
              <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
                Unable to load analysis
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error instanceof Error
                  ? error.message
                  : "We couldn't retrieve the requested analysis. Please check your connection and try again."}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Retry
                </button>
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-red-800 hover:underline dark:text-red-300"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[analysis.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const isPolling =
    analysis.status === "PENDING" ||
    analysis.status === "PROCESSING" ||
    analysis.status === "REVIEW";

  // Unified accessor for AI and Final results
  const aiResult =
    analysis.aiResult ||
    (analysis.aiMatchPercentage !== null &&
    analysis.aiMatchPercentage !== undefined
      ? {
          matchPercentage: analysis.aiMatchPercentage,
          matchedSkills: analysis.aiMatchedSkills || [],
          missingSkills: analysis.aiMissingSkills || [],
        }
      : null);

  // Unified accessor for Final verified result
  const finalResult =
    analysis.finalResult ||
    (analysis.finalMatchPercentage !== null &&
    analysis.finalMatchPercentage !== undefined
      ? {
          matchPercentage: analysis.finalMatchPercentage,
          matchedSkills: analysis.finalMatchedSkills || [],
          missingSkills: analysis.finalMissingSkills || [],
        }
      : null);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Link
          href="/history"
          className="text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
        >
          View all past analyses
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Career Gap Analysis
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {analysis.career?.name || "Target Career"}
            </h1>
            {analysis.career?.description && (
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                {analysis.career.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>
                Created:{" "}
                {new Date(analysis.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span className="font-mono text-zinc-400 truncate max-w-[200px]">
                ID: {analysis.id}
              </span>
            </div>
          </div>

          {/* Status Badge & Polling indicator */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}
            >
              <StatusIcon
                className={`h-3.5 w-3.5 ${
                  analysis.status === "PROCESSING" ? "animate-spin" : ""
                }`}
              />
              {statusConfig.label}
            </span>
            {isPolling && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live updates active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Status Banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <StatusIcon
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              analysis.status === "PROCESSING"
                ? "animate-spin text-blue-600 dark:text-blue-400"
                : analysis.status === "REVIEW"
                  ? "text-amber-600 dark:text-amber-400"
                  : analysis.status === "COMPLETED"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : analysis.status === "FAILED"
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500"
            }`}
          />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {statusConfig.description}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {analysis.status === "FAILED" && analysis.error?.message
                ? analysis.error.message
                : statusConfig.subtext}
            </p>
          </div>
        </div>
      </div>

      {/* Pending / Processing Empty State (No Fake Bars/Percentages) */}
      {(analysis.status === "PENDING" || analysis.status === "PROCESSING") && (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {analysis.status === "PENDING"
              ? "Preparing your analysis..."
              : "AI is analyzing your resume..."}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
            Our AI engine is processing your uploaded resume and comparing your
            skills against industry requirements. Results will appear here
            automatically once ready.
          </p>
        </section>
      )}

      {/* Failed State UI */}
      {analysis.status === "FAILED" && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                Analysis Failed
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300">
                {analysis.error?.message ||
                  "We couldn't complete your analysis. Please upload your resume again or try a different target career."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-medium text-red-800 hover:underline dark:text-red-300"
            >
              Return to Dashboard
            </Link>
          </div>
        </section>
      )}

      {/* Extracted Resume Skills (Rendered when AI has extracted them) */}
      {analysis.extractedSkills && analysis.extractedSkills.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800 gap-2">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Skills Extracted from Resume
              </h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Total: {analysis.extractedSkills.length}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {analysis.extractedSkills.map((skill: string) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* FINAL Verified Result Section (rendered when status is COMPLETED) */}
      {analysis.status === "COMPLETED" && finalResult && (
        <FinalResultSection
          finalMatchPercentage={finalResult.matchPercentage}
          finalMatchedSkills={finalResult.matchedSkills}
          finalMissingSkills={finalResult.missingSkills}
          aiMatchPercentage={aiResult?.matchPercentage}
          aiMatchedSkills={aiResult?.matchedSkills}
          aiMissingSkills={aiResult?.missingSkills}
          career={analysis.career}
        />
      )}

      {/* AI Result Section (rendered during REVIEW, or as fallback if completed without finalResult) */}
      {analysis.status === "REVIEW" && aiResult && (
        <AiResultSection
          matchPercentage={aiResult.matchPercentage}
          matchedSkills={aiResult.matchedSkills}
          missingSkills={aiResult.missingSkills}
          career={analysis.career}
          status={analysis.status}
        />
      )}

      {analysis.status === "COMPLETED" && !finalResult && aiResult && (
        <AiResultSection
          matchPercentage={aiResult.matchPercentage}
          matchedSkills={aiResult.matchedSkills}
          missingSkills={aiResult.missingSkills}
          career={analysis.career}
          status={analysis.status}
        />
      )}
    </div>
  );
}
