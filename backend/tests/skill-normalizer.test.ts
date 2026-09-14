import { describe, expect, it } from "vitest";
import {
  normalizeSkill,
  normalizeSkills,
} from "../src/utils/skill-normalizer";

describe("Skill Normalizer", () => {
  it("normalizes Node variations", () => {
    expect(normalizeSkill("node")).toBe("Node.js");
    expect(normalizeSkill("NodeJS")).toBe("Node.js");
    expect(normalizeSkill(" nodejs ")).toBe("Node.js");
  });

  it("normalizes PostgreSQL variations", () => {
    expect(normalizeSkill("postgres")).toBe("PostgreSQL");
    expect(normalizeSkill("PostgreSQL")).toBe("PostgreSQL");
  });

  it("normalizes React variations", () => {
    expect(normalizeSkill("reactjs")).toBe("React");
    expect(normalizeSkill("React.js")).toBe("React");
  });

  it("normalizes Next.js variations", () => {
    expect(normalizeSkill("nextjs")).toBe("Next.js");
    expect(normalizeSkill("Next.js")).toBe("Next.js");
  });

  it("normalizes whitespace", () => {
    expect(normalizeSkill("  Node.js  ")).toBe("Node.js");
  });

  it("preserves unknown skills", () => {
    expect(normalizeSkill("TensorFlow")).toBe("TensorFlow");
  });

  it("deduplicates normalized skills", () => {
    expect(
      normalizeSkills([
        "Node",
        "Node.js",
        "nodejs",
        "Postgres",
        "PostgreSQL",
      ]),
    ).toEqual([
      "Node.js",
      "PostgreSQL",
    ]);
  });

  it("removes empty skills", () => {
    expect(
      normalizeSkills([
        "Node.js",
        "",
        "   ",
      ]),
    ).toEqual(["Node.js"]);
  });

  it("does not incorrectly transform similar skills", () => {
    expect(normalizeSkill("C")).toBe("C");
    expect(normalizeSkill("C++")).toBe("C++");
    expect(normalizeSkill("Java")).toBe("Java");
    expect(normalizeSkill("JavaScript")).toBe("JavaScript");
  });
});
