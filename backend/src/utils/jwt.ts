import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type UserRole = "USER" | "REVIEWER" | "SUPER_ADMIN";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export function generateAccessToken(
  payload: AccessTokenPayload,
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(
  token: string,
): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.userId !== "string" ||
    !isUserRole(decoded.role)
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: decoded.userId,
    role: decoded.role,
  };
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "USER" ||
    value === "REVIEWER" ||
    value === "SUPER_ADMIN"
  );
}
