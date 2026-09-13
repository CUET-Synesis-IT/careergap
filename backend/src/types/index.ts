export type UserRole =
  | "USER"
  | "REVIEWER"
  | "SUPER_ADMIN";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
