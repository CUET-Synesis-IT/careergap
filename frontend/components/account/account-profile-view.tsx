"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  ListChecks,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export function AccountProfileView() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleLogout = async () => {
    queryClient.clear();
    await logout();
    router.push("/login");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const roleLabels = {
    USER: "Candidate (Standard User)",
    REVIEWER: "Expert Reviewer",
    SUPER_ADMIN: "Platform Super Admin",
  };

  const roleColors = {
    USER: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50",
    REVIEWER:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/50",
    SUPER_ADMIN:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/50",
  };

  const userRole = user?.role || "USER";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Account Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Your personal information, role permissions, and active session details.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-6 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {user?.name || "Anonymous User"}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                <span>{user?.email || "No email available"}</span>
              </div>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleColors[userRole]}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {roleLabels[userRole]}
            </span>
          </div>
        </div>

        {/* Profile Information Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Full Name
            </label>
            <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.name || "—"}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email Address
            </label>
            <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.email || "—"}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Assigned Role
            </label>
            <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {userRole}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Account Status
            </label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Active & Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Capabilities & Navigation */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Role Access & Quick Links
        </h3>

        {userRole === "USER" && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              As a candidate, you can upload your PDF resume, choose desired career paths, and receive AI & human-verified skill gap analyses.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <FileText className="h-3.5 w-3.5" />
                Go to Dashboard
              </Link>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Start New Analysis
              </Link>
            </div>
          </div>
        )}

        {userRole === "REVIEWER" && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              As a reviewer, you have access to the review task queue to claim candidate analyses, verify AI skill evaluations, and submit finalized assessments.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href="/reviewer/tasks"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Go to Review Queue
              </Link>
            </div>
          </div>
        )}

        {userRole === "SUPER_ADMIN" && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              As a super administrator, you manage the reviewer workforce, create reviewer accounts, and toggle activation status.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href="/admin/reviewers"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Users className="h-3.5 w-3.5" />
                Reviewer Management
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Security & Sign Out Section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Active Session
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Secure authentication via JWT Bearer tokens.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
