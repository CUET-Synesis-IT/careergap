"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, ArrowRight, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin.api";
import { ApiError } from "@/lib/api/client";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "reviewers"],
    queryFn: () => adminApi.getReviewers(),
  });

  const reviewers = Array.isArray(data)
    ? data
    : data?.reviewers && Array.isArray(data.reviewers)
      ? data.reviewers
      : [];

  const totalReviewers = reviewers.length;
  const activeReviewers = reviewers.filter(
    (reviewer) => reviewer.isActive,
  ).length;
  const inactiveReviewers = reviewers.filter(
    (reviewer) => !reviewer.isActive,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Welcome, {user?.name || "Super Admin"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Platform administration and reviewer management.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Reviewers
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isLoading ? "—" : totalReviewers}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-100 p-2.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-950/60 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Active Reviewers
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-300">
                {isLoading ? "—" : activeReviewers}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Inactive Reviewers
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
                {isLoading ? "—" : inactiveReviewers}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-100 p-2.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <UserX className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/40">
          <h2 className="font-semibold text-red-700 dark:text-red-300">
            Unable to load reviewer statistics
          </h2>

          <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
            {error instanceof ApiError
              ? error.message
              : "Failed to connect to the CareerGap server."}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Try Again
          </button>
        </div>
      )}

      {/* Reviewer Management */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Reviewer Management
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Create, activate, deactivate, and manage reviewer accounts.
            </p>
          </div>

          <Link
            href="/admin/reviewers"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Manage Reviewers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
