import { ProtectedRoute } from "@/components/auth/protected-route";
import { ReviewerNav } from "@/components/navigation/reviewer-nav";

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["REVIEWER"]}>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <ReviewerNav />
        <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

