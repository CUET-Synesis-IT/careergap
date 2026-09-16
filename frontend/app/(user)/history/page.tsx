"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { analysisApi } from "@/lib/api/analysis.api";
import type { Analysis, AnalysisStatus } from "@/lib/api/types";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
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
  if (
    analysis.status === "COMPLETED" &&
    analysis.finalResult?.matchPercentage != null
  ) {
    return `${analysis.finalResult.matchPercentage.toFixed(1)}%`;
  }
  if (
    analysis.status === "REVIEW" &&
    analysis.aiResult?.matchPercentage != null
  ) {
    return `${analysis.aiResult.matchPercentage.toFixed(1)}% (AI)`;
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

export default function HistoryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => analysisApi.getAll(),
  });

  const analyses = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Analysis History
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Browse all past skill gap analyses submitted for your account.
        </p>
      </div>

      {isLoading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="mt-4 text-sm text-zinc-500">Loading your history...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
          <p className="font-semibold">Unable to load history</p>
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
          {analyses.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <FileText className="h-10 w-10 text-zinc-400 mb-3" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                No analyses found
              </h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                You haven&apos;t analyzed any resumes yet.
              </p>
              <Link
                href="/analyze"
                className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Analyze a Resume
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {analyses.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.career?.name || "Career Analysis"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Date: {formatDate(item.createdAt)}
                      </p>
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
          )}
        </>
      )}
    </div>
  );
}
