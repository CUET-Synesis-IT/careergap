import { describe, expect, it } from "vitest";
import {
  resumeSkillExtractionSchema,
} from "../src/ai/skill-extraction.schema";

describe("Resume Skill Extraction Schema", () => {
  it("accepts valid skills", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      skills: [
        "JavaScript",
        "TypeScript",
        "Node.js",
        "PostgreSQL",
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty skill list", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      skills: [],
    });

    expect(result.success).toBe(true);
  });

  it("trims skill names", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      skills: ["  Node.js  "],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.skills).toEqual(["Node.js"]);
    }
  });

  it("rejects non-string skills", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      skills: [
        "Node.js",
        123,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty skill names", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      skills: [
        "Node.js",
        "",
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects more than 100 skills", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      skills: Array.from(
        { length: 101 },
        (_, index) => `Skill ${index}`,
      ),
    });

    expect(result.success).toBe(false);
  });

  it("rejects malformed responses", () => {
    const result = resumeSkillExtractionSchema.safeParse({
      result: ["Node.js"],
    });

    expect(result.success).toBe(false);
  });
});
