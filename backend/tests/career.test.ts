import crypto from "node:crypto";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../src/app";
import { prisma } from "../src/config/database";
import { login, register } from "../src/services/auth.service";

describe("Career API", () => {
  let userToken: string;
  let userId: string | undefined;

  let careerId: string;

  const email = `career-test-${crypto.randomUUID()}@example.com`;
  const password = "TestPassword123!";

  beforeAll(async () => {
    const user = await register({
      name: "Career Test User",
      email,
      password,
    });

    userId = user.id;

    const result = await login({
      email,
      password,
    });

    userToken = result.accessToken;

    const career = await prisma.career.findUnique({
      where: {
        slug: "backend_engineer",
      },
      select: {
        id: true,
      },
    });

    if (!career) {
      throw new Error(
        "backend_engineer career was not seeded.",
      );
    }

    careerId = career.id;
  });

  afterAll(async () => {
    if (!userId) {
      return;
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  });

  it("returns all predefined careers", async () => {
    const response = await request(app)
      .get("/api/careers")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.careers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "backend_engineer",
          name: "Backend Engineer",
        }),
        expect.objectContaining({
          slug: "frontend_engineer",
          name: "Frontend Engineer",
        }),
        expect.objectContaining({
          slug: "ai_ml_engineer",
          name: "AI/ML Engineer",
        }),
        expect.objectContaining({
          slug: "devops_engineer",
          name: "DevOps Engineer",
        }),
        expect.objectContaining({
          slug: "data_engineer",
          name: "Data Engineer",
        }),
      ]),
    );
  });

  it("returns one career by ID", async () => {
    const response = await request(app)
      .get(`/api/careers/${careerId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        career: expect.objectContaining({
          id: careerId,
          slug: "backend_engineer",
          name: "Backend Engineer",
          description:
            "Builds server-side applications, APIs, databases, distributed systems, and backend infrastructure.",
        }),
      },
    });
  });

  it("does not expose the career profile in the normal career response", async () => {
    const response = await request(app)
      .get(`/api/careers/${careerId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body.data.career).not.toHaveProperty(
      "profile",
    );
  });

  it("rejects unauthenticated career listing", async () => {
    const response = await request(app).get(
      "/api/careers",
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 404 for an unknown career", async () => {
    const response = await request(app)
      .get(`/api/careers/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Career not found.",
      code: "CAREER_NOT_FOUND",
    });
  });
});
