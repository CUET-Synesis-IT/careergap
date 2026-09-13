"use client";

import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Review your skill gap analyses and upload new resumes.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-2">User Dashboard Shell</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Full dashboard widgets and real analysis cards will be wired in Day 3.
        </p>
      </div>
    </div>
  );
}

