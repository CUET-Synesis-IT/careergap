import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminNav } from "@/components/navigation/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <AdminNav />
        <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

