export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Analysis History
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Browse your past resume analyses and track your progress over time.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-2">Analysis History Shell</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          History table will display your historical gap reports.
        </p>
      </div>
    </div>
  );
}

