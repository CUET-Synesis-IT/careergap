export default function CurrentReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          My Current Review
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Review task currently locked by you with countdown timer.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-2">Active Task Shell</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Side-by-side resume text and AI skill editor with 15-minute lock timer.
        </p>
      </div>
    </div>
  );
}

