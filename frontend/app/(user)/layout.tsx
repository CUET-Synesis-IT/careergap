import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserNav } from "@/components/navigation/user-nav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["USER"]}>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <UserNav />
        <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

