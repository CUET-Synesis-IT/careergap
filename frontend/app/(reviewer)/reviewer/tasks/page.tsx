export default function ReviewerTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Review Task Queue
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Open review tasks available to claim and verify.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-2">Review Tasks Queue Shell</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Task claiming and verification interface will be wired in Day 5.
        </p>
      </div>
    </div>
  );
}

