import bcrypt from "bcrypt";
import crypto from "node:crypto";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import app from "../src/app";
import { prisma } from "../src/config/database";

describe("Admin Reviewer REST API", () => {
  const createdUserIds: string[] = [];

  const passwordForTests = "Password123!";

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds,
          },
        },
      });

      createdUserIds.length = 0;
    }
  });

  async function createUser(
    role: "USER" | "REVIEWER" | "SUPER_ADMIN" = "USER",
    options?: {
      email?: string;
      isActive?: boolean;
    },
  ) {
    const passwordHash = await bcrypt.hash(passwordForTests, 4);

    const user = await prisma.user.create({
      data: {
        name: `${role} Test User`,
        email:
          options?.email ??
          `${crypto.randomUUID()}@admin.test`,
        passwordHash,
        role,
        isActive: options?.isActive ?? true,
      },
    });

    createdUserIds.push(user.id);

    return user;
  }

  async function getAccessToken(
    email: string,
    password = passwordForTests,
  ) {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      });

    expect(response.status).toBe(200);

    return response.body.data.accessToken as string;
  }

  async function createAuthenticatedUser(
    role: "USER" | "REVIEWER" | "SUPER_ADMIN",
  ) {
    const user = await createUser(role);
    const token = await getAccessToken(user.email);

    return {
      user,
      token,
    };
  }

  it("returns 401 when unauthenticated user requests reviewers", async () => {
    const response = await request(app)
      .get("/api/admin/reviewers");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 403 when USER requests reviewers", async () => {
    const { token } = await createAuthenticatedUser("USER");

    const response = await request(app)
      .get("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("returns 403 when REVIEWER requests reviewers", async () => {
    const { token } = await createAuthenticatedUser("REVIEWER");

    const response = await request(app)
      .get("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("allows SUPER_ADMIN to list reviewers", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const reviewer = await createUser("REVIEWER");

    const response = await request(app)
      .get("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.reviewers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: reviewer.id,
          name: reviewer.name,
          email: reviewer.email,
          role: "REVIEWER",
          isActive: true,
        }),
      ]),
    );
  });

  it("creates a reviewer through the admin API", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const email = `${crypto.randomUUID()}@reviewer.test`;

    const response = await request(app)
      .post("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "New Reviewer",
        email,
        password: passwordForTests,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const reviewer = response.body.data.reviewer;

    expect(reviewer).toEqual(
      expect.objectContaining({
        name: "New Reviewer",
        email,
        role: "REVIEWER",
        isActive: true,
      }),
    );

    expect(reviewer).not.toHaveProperty("password");
    expect(reviewer).not.toHaveProperty("passwordHash");

    const databaseUser = await prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
    });

    createdUserIds.push(databaseUser.id);

    expect(databaseUser.role).toBe("REVIEWER");
    expect(databaseUser.isActive).toBe(true);

    expect(databaseUser.passwordHash).not.toBe(passwordForTests);

    const passwordMatches = await bcrypt.compare(
      passwordForTests,
      databaseUser.passwordHash,
    );

    expect(passwordMatches).toBe(true);
  });

  it("does not allow the client to choose SUPER_ADMIN role", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const email = `${crypto.randomUUID()}@reviewer.test`;

    const response = await request(app)
      .post("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Attempted Admin",
        email,
        password: passwordForTests,
        role: "SUPER_ADMIN",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const databaseUser = await prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
    });

    createdUserIds.push(databaseUser.id);

    expect(databaseUser.role).toBe("REVIEWER");
  });

  it("returns 409 when creating a reviewer with an existing email", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const existingReviewer = await createUser("REVIEWER");

    const response = await request(app)
      .post("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Duplicate Reviewer",
        email: existingReviewer.email,
        password: passwordForTests,
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("returns 422 for invalid reviewer creation data", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const response = await request(app)
      .post("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        email: "not-an-email",
        password: "short",
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when USER tries to create a reviewer", async () => {
    const { token } = await createAuthenticatedUser("USER");

    const response = await request(app)
      .post("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Reviewer",
        email: `${crypto.randomUUID()}@reviewer.test`,
        password: passwordForTests,
      });

    expect(response.status).toBe(403);
  });

  it("returns 403 when REVIEWER tries to create a reviewer", async () => {
    const { token } = await createAuthenticatedUser("REVIEWER");

    const response = await request(app)
      .post("/api/admin/reviewers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Reviewer",
        email: `${crypto.randomUUID()}@reviewer.test`,
        password: passwordForTests,
      });

    expect(response.status).toBe(403);
  });

  it("deactivates a reviewer", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const reviewer = await createUser("REVIEWER");

    const response = await request(app)
      .patch(`/api/admin/reviewers/${reviewer.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.reviewer).toEqual(
      expect.objectContaining({
        id: reviewer.id,
        role: "REVIEWER",
        isActive: false,
      }),
    );

    const databaseUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: reviewer.id,
      },
    });

    expect(databaseUser.isActive).toBe(false);
  });

  it("activates an inactive reviewer", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const reviewer = await createUser("REVIEWER", {
      isActive: false,
    });

    const response = await request(app)
      .patch(`/api/admin/reviewers/${reviewer.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.reviewer).toEqual(
      expect.objectContaining({
        id: reviewer.id,
        role: "REVIEWER",
        isActive: true,
      }),
    );

    const databaseUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: reviewer.id,
      },
    });

    expect(databaseUser.isActive).toBe(true);
  });

  it("returns 404 when updating a nonexistent reviewer", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const response = await request(app)
      .patch(`/api/admin/reviewers/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("REVIEWER_NOT_FOUND");
  });

  it("returns 422 for an invalid reviewer id", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const response = await request(app)
      .patch("/api/admin/reviewers/not-a-uuid")
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("does not allow updating a USER as a reviewer", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const user = await createUser("USER");

    const response = await request(app)
      .patch(`/api/admin/reviewers/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("REVIEWER_NOT_FOUND");
  });

  it("does not allow updating a SUPER_ADMIN as a reviewer", async () => {
    const { token } = await createAuthenticatedUser("SUPER_ADMIN");

    const anotherAdmin = await createUser("SUPER_ADMIN");

    const response = await request(app)
      .patch(`/api/admin/reviewers/${anotherAdmin.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("REVIEWER_NOT_FOUND");
  });

  it("returns 403 when REVIEWER tries to deactivate another reviewer", async () => {
    const { token } = await createAuthenticatedUser("REVIEWER");

    const reviewer = await createUser("REVIEWER");

    const response = await request(app)
      .patch(`/api/admin/reviewers/${reviewer.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(403);
  });
});
