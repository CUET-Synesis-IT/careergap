"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { analysisApi } from "@/lib/api/analysis.api";
import type { Analysis, AnalysisStatus } from "@/lib/api/types";
import {
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  TrendingUp,
} from "lucide-react";

function getStatusBadge(status: AnalysisStatus) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    case "REVIEW":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <Clock className="h-3 w-3" />
          Waiting for Review
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 animate-pulse dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>
      );
  }
}

function getMatchScore(analysis: Analysis): string {
  if (analysis.status === "COMPLETED" && analysis.finalResult?.matchPercentage != null) {
    return `${analysis.finalResult.matchPercentage}%`;
  }
  if (analysis.status === "REVIEW" && analysis.aiResult?.matchPercentage != null) {
    return `${analysis.aiResult.matchPercentage}% (AI)`;
  }
  return "—";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function UserDashboard() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => analysisApi.getAll(),
  });

  const analyses: Analysis[] = data?.analyses || [];

  // Summary counts derived strictly from backend analyses
  const totalCount = analyses.length;
  const completedCount = analyses.filter((a) => a.status === "COMPLETED").length;
  const inReviewCount = analyses.filter((a) => a.status === "REVIEW").length;
  const processingCount = analyses.filter(
    (a) => a.status === "PROCESSING" || a.status === "PENDING"
  ).length;

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Welcome, {user?.name || "User"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Upload your resume and discover how well your skills match your target career.
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Analyze New Resume
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="mt-4 text-sm text-zinc-500">Loading your dashboard...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
          <p className="font-semibold">Unable to load your analyses</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            There was a problem connecting to the server.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-200"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Empty State */}
          {analyses.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                <FileText className="h-7 w-7 text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                You haven&apos;t analyzed a resume yet.
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Upload your resume and compare your skills with a career you&apos;re interested in.
              </p>
              <Link
                href="/analyze"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Analyze My Resume
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Analyses</p>
                  <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalCount}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {completedCount}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">In Review</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{inReviewCount}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Processing</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{processingCount}</p>
                </div>
              </div>

              {/* Latest Analysis Highlight */}
              {latestAnalysis && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-zinc-500" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                        Latest Analysis
                      </h2>
                    </div>
                    {getStatusBadge(latestAnalysis.status)}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3 items-center">
                    <div>
                      <p className="text-xs text-zinc-500">Target Career</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {latestAnalysis.career?.name || "Career Analysis"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">Match Score</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {getMatchScore(latestAnalysis)}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <Link
                        href={`/analysis/${latestAnalysis.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {latestAnalysis.status === "COMPLETED"
                          ? "View Final Result"
                          : latestAnalysis.status === "REVIEW"
                          ? "View Initial Result"
                          : "View Analysis"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis History Section */}
              <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Analysis History
                  </h2>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {analyses.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.career?.name || "Engineering Career"}
                        </p>
                        <p className="text-xs text-zinc-500">Created: {formatDate(item.createdAt)}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-zinc-400">Match</p>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {getMatchScore(item)}
                          </p>
                        </div>

                        <div>{getStatusBadge(item.status)}</div>

                        <Link
                          href={`/analysis/${item.id}`}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
