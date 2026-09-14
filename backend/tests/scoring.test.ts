import { describe, expect, it } from "vitest";
import { calculateSkillMatch } from "../src/services/scoring.service";

describe("Skill Matching and Scoring", () => {
  const careerSkills = [
    {
      name: "Node.js",
      importance: "HIGH" as const,
    },
    {
      name: "PostgreSQL",
      importance: "HIGH" as const,
    },
    {
      name: "Docker",
      importance: "MEDIUM" as const,
    },
    {
      name: "Redis",
      importance: "MEDIUM" as const,
    },
    {
      name: "Kubernetes",
      importance: "LOW" as const,
    },
    {
      name: "System Design",
      importance: "HIGH" as const,
    },
  ];

  it("calculates matched and missing skills", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
        "PostgreSQL",
        "Docker",
      ],
      careerSkills,
    );

    expect(result.matchedSkills).toEqual([
      "Node.js",
      "PostgreSQL",
      "Docker",
    ]);

    expect(result.missingSkills).toEqual([
      "Redis",
      "Kubernetes",
      "System Design",
    ]);
  });

  it("calculates the percentage deterministically", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
        "PostgreSQL",
        "Docker",
      ],
      careerSkills,
    );

    expect(result.matchPercentage).toBe(50);
  });

  it("rounds percentage to two decimal places", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
        "PostgreSQL",
      ],
      careerSkills,
    );

    expect(result.matchPercentage).toBe(33.33);
  });

  it("matches normalized skill variations", () => {
    const result = calculateSkillMatch(
      [
        "nodejs",
        "postgres",
        "docker",
      ],
      careerSkills,
    );

    expect(result.matchedSkills).toEqual([
      "Node.js",
      "PostgreSQL",
      "Docker",
    ]);

    expect(result.matchPercentage).toBe(50);
  });

  it("deduplicates repeated user skills", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
        "nodejs",
        "Node",
        "PostgreSQL",
      ],
      careerSkills,
    );

    expect(result.matchedSkills).toEqual([
      "Node.js",
      "PostgreSQL",
    ]);

    expect(result.matchPercentage).toBe(33.33);
  });

  it("does not give extra score for skill importance", () => {
    const result = calculateSkillMatch(
      [
        "Kubernetes",
      ],
      careerSkills,
    );

    expect(result.matchedSkills).toEqual([
      "Kubernetes",
    ]);

    // 1 of 6, regardless of LOW importance.
    expect(result.matchPercentage).toBe(16.67);
  });

  it("returns zero when no skills match", () => {
    const result = calculateSkillMatch(
      [
        "Python",
        "TensorFlow",
      ],
      careerSkills,
    );

    expect(result.matchPercentage).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual([
      "Node.js",
      "PostgreSQL",
      "Docker",
      "Redis",
      "Kubernetes",
      "System Design",
    ]);
  });

  it("returns 100 when every required skill matches", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
        "PostgreSQL",
        "Docker",
        "Redis",
        "Kubernetes",
        "System Design",
      ],
      careerSkills,
    );

    expect(result.matchPercentage).toBe(100);
    expect(result.matchedSkills).toHaveLength(6);
    expect(result.missingSkills).toEqual([]);
  });

  it("ignores extra user skills that are not required", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
        "PostgreSQL",
        "Python",
        "TensorFlow",
      ],
      careerSkills,
    );

    expect(result.matchedSkills).toEqual([
      "Node.js",
      "PostgreSQL",
    ]);

    expect(result.matchPercentage).toBe(33.33);
  });

  it("returns zero when career has no required skills", () => {
    const result = calculateSkillMatch(
      [
        "Node.js",
      ],
      [],
    );

    expect(result.matchPercentage).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual([]);
  });
});
