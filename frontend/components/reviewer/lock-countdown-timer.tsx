"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, Info, ShieldAlert } from "lucide-react";

interface LockCountdownTimerProps {
  lockExpiresAt: string | null | undefined;
  onExpire?: () => void;
}

export function LockCountdownTimer({
  lockExpiresAt,
  onExpire,
}: LockCountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (!lockExpiresAt) return null;
    const diff = Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!lockExpiresAt) return;

    const tick = () => {
      const diff = Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000);
      const nextRemaining = Math.max(0, diff);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0 && onExpire) {
        onExpire();
      }
    };

    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt, onExpire]);

  if (remainingSeconds === null) {
    return null;
  }

  const isExpired = remainingSeconds <= 0;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 120; // < 2 minutes

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isExpired
          ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40"
          : isUrgent
            ? "border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-lg p-2 ${
              isExpired
                ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
                : isUrgent
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {isExpired ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm font-semibold ${
                  isExpired
                    ? "text-red-900 dark:text-red-200"
                    : isUrgent
                      ? "text-amber-900 dark:text-amber-200"
                      : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {isExpired ? "Review Lock Expired" : "Review Reserved for You"}
              </h3>
              {!isExpired && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isUrgent
                      ? "bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  Active Lock
                </span>
              )}
            </div>

            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Visual aid only — the backend remains authoritative on lock expiry.</span>
            </p>
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-center gap-3 sm:text-right">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Time Remaining
            </span>
            <span
              className={`font-mono text-2xl font-bold tracking-tight ${
                isExpired
                  ? "text-red-600 dark:text-red-400"
                  : isUrgent
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Expired Callout */}
      {isExpired && (
        <div className="mt-3.5 flex flex-col gap-2 rounded-lg border border-red-200 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/40 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>Your review lock has expired. Please return to the queue and claim the task again.</span>
          </div>
          <Link
            href="/reviewer/tasks"
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition dark:bg-red-700 dark:hover:bg-red-600"
          >
            Return to Review Queue
          </Link>
        </div>
      )}
    </div>
  );
}
