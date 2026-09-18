"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import { ApiError } from "@/lib/api/client";
import type { Reviewer } from "@/lib/api/types";
import {
  AlertCircle,
  Clock,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";

function formatDate(dateStr: string) {
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

export default function AdminReviewersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "reviewers"],
    queryFn: () => adminApi.getReviewers(),
  });

  const createMutation = useMutation({
    mutationFn: (newReviewer: typeof formData) => adminApi.createReviewer(newReviewer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviewers"] });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "" });
      setFormError("");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create reviewer"
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateReviewer(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviewers"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    createMutation.mutate(formData);
  };

  const reviewers: Reviewer[] = Array.isArray(data)
    ? data
    : data?.reviewers && Array.isArray(data.reviewers)
      ? data.reviewers
      : [];

  const totalReviewers = reviewers.length;
  const activeReviewers = reviewers.filter((r) => r.isActive).length;
  const inactiveReviewers = reviewers.filter((r) => !r.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Reviewer Management
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create, activate, and deactivate reviewer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Refresh reviewer list"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin text-zinc-900 dark:text-zinc-100" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setFormError("");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Reviewer</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-16 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Loading reviewers...</p>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
          <h2 className="mt-2 font-semibold">Unable to load reviewers</h2>
          <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
            {error instanceof ApiError
              ? error.message
              : "Failed to connect to the CareerGap server. Please try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && reviewers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white p-16 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No reviewers
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            No reviewers have been added yet. Add a reviewer to start assigning verification tasks.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => {
                setFormError("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Reviewer</span>
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh List</span>
            </button>
          </div>
        </div>
      )}

      {/* Reviewer Table */}
      {!isLoading && !isError && reviewers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/75 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Reviewer
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Role
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Joined
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800 dark:text-zinc-300">
                {reviewers.map((reviewer) => {
                  const initial = reviewer.name ? reviewer.name.charAt(0).toUpperCase() : "R";
                  const isPending =
                    toggleMutation.isPending &&
                    toggleMutation.variables?.id === reviewer.id;

                  return (
                    <tr
                      key={reviewer.id}
                      className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                    >
                      {/* Name with Avatar */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                            {initial}
                          </span>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {reviewer.name}
                            </p>
                            <p className="font-mono text-[11px] text-zinc-400">
                              #{reviewer.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{reviewer.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                          <ShieldCheck className="h-3 w-3" />
                          {reviewer.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-5 py-4">
                        {reviewer.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{formatDate(reviewer.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            toggleMutation.mutate({
                              id: reviewer.id,
                              isActive: !reviewer.isActive,
                            })
                          }
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            reviewer.isActive
                              ? "text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          }`}
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : reviewer.isActive ? (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Reviewer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Add New Reviewer
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
                  placeholder="reviewer@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createMutation.isPending}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Create Reviewer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
