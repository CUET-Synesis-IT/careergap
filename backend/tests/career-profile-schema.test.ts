import { describe, expect, it } from "vitest";

import {
  careerProfileSchema,
} from "../src/ai/career-profile.schema";

describe("Career profile schema", () => {
  it("accepts a valid career profile", () => {
    const result = careerProfileSchema.safeParse({
      skills: [
        {
          name: "Node.js",
          importance: "HIGH",
        },
        {
          name: "Docker",
          importance: "MEDIUM",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid importance value", () => {
    const result = careerProfileSchema.safeParse({
      skills: [
        {
          name: "Node.js",
          importance: "VERY_HIGH",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty skills array", () => {
    const result = careerProfileSchema.safeParse({
      skills: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing skills field", () => {
    const result = careerProfileSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects non-object skill entries", () => {
    const result = careerProfileSchema.safeParse({
      skills: ["Node.js"],
    });

    expect(result.success).toBe(false);
  });
});
