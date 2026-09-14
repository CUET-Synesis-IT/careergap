import { describe, expect, it } from "vitest";
import { createAnalysisSchema } from "../src/validators/analysis.validator";

describe("Create Analysis Validator", () => {
  const validInput = {
    resumeId: "550e8400-e29b-41d4-a716-446655440000",
    careerId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  };

  it("accepts valid resume and career IDs", () => {
    const result = createAnalysisSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it("rejects missing resumeId", () => {
    const result = createAnalysisSchema.safeParse({
      careerId: validInput.careerId,
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing careerId", () => {
    const result = createAnalysisSchema.safeParse({
      resumeId: validInput.resumeId,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid resumeId", () => {
    const result = createAnalysisSchema.safeParse({
      ...validInput,
      resumeId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid careerId", () => {
    const result = createAnalysisSchema.safeParse({
      ...validInput,
      careerId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty strings", () => {
    const result = createAnalysisSchema.safeParse({
      resumeId: "",
      careerId: "",
    });

    expect(result.success).toBe(false);
  });

  it("does not accept frontend-controlled analysis fields", () => {
    const result = createAnalysisSchema.safeParse({
      ...validInput,
      skills: ["Node.js"],
      matchPercentage: 90,
      missingSkills: ["Redis"],
      matchedSkills: ["Node.js"],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });
});
