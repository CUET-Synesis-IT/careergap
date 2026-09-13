import { describe, expect, it } from "vitest";

import { generateAccessToken, verifyAccessToken } from "../src/utils/jwt";

describe("JWT utility", () => {
  it("generates and verifies an access token", () => {
    const payload = {
      userId: "test-user-id",
      role: "USER" as const,
    };

    const token = generateAccessToken(payload);

    expect(token).toBeTypeOf("string");
    expect(token.length).toBeGreaterThan(0);

    const decoded = verifyAccessToken(token);

    expect(decoded).toEqual(payload);
  });

  it("rejects an invalid token", () => {
    expect(() => {
      verifyAccessToken("invalid-token");
    }).toThrow();
  });

  it("rejects a token signed with the wrong secret", async () => {
    const jwt = await import("jsonwebtoken");
    const { env } = await import("../src/config/env");

    const token = jwt.default.sign(
      {
        userId: "test-user-id",
        role: "USER",
      },
      `${env.JWT_SECRET}-wrong`,
      {
        expiresIn: "15m",
      },
    );

    expect(() => {
      verifyAccessToken(token);
    }).toThrow();
  });
});

import { loginSchema, registerSchema } from "../src/validators/auth.validator";

describe("Auth validators", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "TEST@EXAMPLE.COM",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects invalid registration data", () => {
    const result = registerSchema.safeParse({
      name: "A",
      email: "not-an-email",
      password: "123",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "TEST@EXAMPLE.COM",
      password: "password",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects invalid login email", () => {
    const result = loginSchema.safeParse({
      email: "bad-email",
      password: "password",
    });

    expect(result.success).toBe(false);
  });
});
