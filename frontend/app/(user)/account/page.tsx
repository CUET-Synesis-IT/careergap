"use client";

import { useAuth } from "@/context/auth-context";

export default function UserAccountPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Manage your personal profile and account credentials.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 max-w-xl space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</label>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{user?.name || "—"}</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</label>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{user?.email || "—"}</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Role</label>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{user?.role || "—"}</p>
        </div>
      </div>
    </div>
  );
}

