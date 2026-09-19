"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getRoleDefaultPath } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/api/types";
import { Loader2, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-700 dark:text-zinc-300" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Authenticating...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // 403 Forbidden: Role Mismatch per frontend-plan.md Section 122
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Access Denied
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href={getRoleDefaultPath(user.role)}
          className="mt-6 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
        >
          Return to your Workspace
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
