import { describe, expect, it } from "vitest";
import { submitReviewSchema } from "../src/validators/review.validator";

describe("Submit Review Validator", () => {
  const validInput = {
    finalMatchPercentage: 75,
    finalMatchedSkills: ["Node.js", "PostgreSQL", "Docker"],
    finalMissingSkills: ["Redis", "System Design"],
    comment: "Docker experience was present in the resume.",
  };

  it("accepts a valid review", () => {
    const result = submitReviewSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it("accepts review without comment", () => {
    const result = submitReviewSchema.safeParse({
      finalMatchPercentage: 75,
      finalMatchedSkills: ["Node.js"],
      finalMissingSkills: ["Redis"],
    });

    expect(result.success).toBe(true);
  });

  it("accepts 0 percent", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchPercentage: 0,
    });

    expect(result.success).toBe(true);
  });

  it("accepts 100 percent", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchPercentage: 100,
    });

    expect(result.success).toBe(true);
  });

  it("rejects percentage below 0", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchPercentage: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects percentage above 100", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchPercentage: 101,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-number percentage", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchPercentage: "75",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing finalMatchPercentage", () => {
    const { finalMatchPercentage: _ignored, ...withoutPercentage } = validInput;

    const result = submitReviewSchema.safeParse(withoutPercentage);

    expect(result.success).toBe(false);
  });

  it("rejects missing finalMatchedSkills", () => {
    const { finalMatchedSkills: _ignored, ...withoutMatchedSkills } =
      validInput;

    const result = submitReviewSchema.safeParse(withoutMatchedSkills);

    expect(result.success).toBe(false);
  });

  it("rejects missing finalMissingSkills", () => {
    const { finalMissingSkills: _ignored, ...withoutMissingSkills } =
      validInput;

    const result = submitReviewSchema.safeParse(withoutMissingSkills);

    expect(result.success).toBe(false);
  });

  it("rejects non-array matched skills", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchedSkills: "Node.js",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-array missing skills", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMissingSkills: "Redis",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-string matched skills", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchedSkills: ["Node.js", 123],
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-string missing skills", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMissingSkills: ["Redis", 123],
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty matched skill names", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchedSkills: ["Node.js", ""],
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty missing skill names", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMissingSkills: ["Redis", "   "],
    });

    expect(result.success).toBe(false);
  });

  it("trims skill names", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchedSkills: ["  Node.js  "],
      finalMissingSkills: ["  Redis  "],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.finalMatchedSkills).toEqual(["Node.js"]);

      expect(result.data.finalMissingSkills).toEqual(["Redis"]);
    }
  });

  it("accepts an empty matched skills array", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMatchedSkills: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty missing skills array", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      finalMissingSkills: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a comment longer than 2000 characters", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "a".repeat(2001),
    });

    expect(result.success).toBe(false);
  });

  it("accepts a comment exactly 2000 characters long", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "a".repeat(2000),
    });

    expect(result.success).toBe(true);
  });

  it("trims the comment", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "  Good review.  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.comment).toBe("Good review.");
    }
  });
});
