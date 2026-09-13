import crypto from "node:crypto";
import { readFile } from "node:fs/promises";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../src/app";
import { prisma } from "../src/config/database";
import { login, register } from "../src/services/auth.service";

describe("Resume API", () => {
  let userAToken: string;
  let userBToken: string;

  let userAId: string | undefined;
  let userBId: string | undefined;

  let resumeId: string;

  const userAEmail = `resume-test-a-${crypto.randomUUID()}@example.com`;
  const userBEmail = `resume-test-b-${crypto.randomUUID()}@example.com`;

  const password = "TestPassword123!";

  beforeAll(async () => {
    const userA = await register({
      name: "Resume Test User A",
      email: userAEmail,
      password,
    });

    const userB = await register({
      name: "Resume Test User B",
      email: userBEmail,
      password,
    });

    userAId = userA.id;
    userBId = userB.id;

    const loginA = await login({
      email: userAEmail,
      password,
    });

    const loginB = await login({
      email: userBEmail,
      password,
    });

    userAToken = loginA.accessToken;
    userBToken = loginB.accessToken;
  });

  afterAll(async () => {
    const userIds = [userAId, userBId].filter((id): id is string =>
      Boolean(id),
    );

    if (userIds.length === 0) {
      return;
    }

    await prisma.resume.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  });

  it("uploads a valid PDF resume", async () => {
    const pdf = await readFile("tests/fixtures/sample-resume.pdf");

    const response = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${userAToken}`)
      .attach("file", pdf, {
        filename: "sample-resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.resume).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        fileName: "sample-resume.pdf",
        createdAt: expect.any(String),
      }),
    );

    resumeId = response.body.data.resume.id;

    const storedResume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
      },
    });

    expect(storedResume).not.toBeNull();

    expect(storedResume).toEqual(
      expect.objectContaining({
        id: resumeId,
        userId: userAId,
        fileName: "sample-resume.pdf",
        text: expect.any(String),
        textHash: expect.any(String),
      }),
    );

    expect(storedResume!.text.length).toBeGreaterThan(50);
    expect(storedResume!.textHash).toHaveLength(64);
  });

  it("gets a resume owned by the current user", async () => {
    const response = await request(app)
      .get(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.resume).toEqual(
      expect.objectContaining({
        id: resumeId,
        fileName: "sample-resume.pdf",
        createdAt: expect.any(String),
      }),
    );
  });

  it("does not allow another user to access the resume", async () => {
    const response = await request(app)
      .get(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Resume not found.",
      code: "RESUME_NOT_FOUND",
    });
  });

  it("rejects upload without authentication", async () => {
    const pdf = await readFile("tests/fixtures/sample-resume.pdf");

    const response = await request(app)
      .post("/api/resumes")
      .attach("file", pdf, {
        filename: "sample-resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects upload when no file is provided", async () => {
    const response = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Resume file is required.",
      code: "FILE_REQUIRED",
    });
  });

  it("rejects a non-PDF file", async () => {
    const textFile = Buffer.from("This is not a PDF resume.", "utf8");

    const response = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${userAToken}`)
      .attach("file", textFile, {
        filename: "resume.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Only PDF files are supported.",
      code: "INVALID_FILE_TYPE",
    });
  });

  it("rejects an invalid PDF", async () => {
    const invalidPdf = Buffer.from("This is not a real PDF file.", "utf8");

    const response = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${userAToken}`)
      .attach("file", invalidPdf, {
        filename: "invalid.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(422);

    expect(response.body).toEqual({
      success: false,
      message: "Unable to read this PDF.",
      code: "RESUME_EXTRACTION_FAILED",
    });
  });
});
