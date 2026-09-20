"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>

        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred.
        </p>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-md border px-4 py-2 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
