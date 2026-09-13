import type { UserRole } from "@/lib/api/types";

export function getRoleDefaultPath(role: UserRole | null | undefined): string {
  switch (role) {
    case "REVIEWER":
      return "/reviewer/tasks";
    case "SUPER_ADMIN":
      return "/admin/reviewers";
    case "USER":
    default:
      return "/dashboard";
  }
}

