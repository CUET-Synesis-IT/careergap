import { describe, expect, it } from "vitest";
import { normalizeResumeText } from "../src/utils/resume-text";

describe("normalizeResumeText", () => {
  it("normalizes repeated spaces", () => {
    const input = "John    Doe     Software   Engineer";

    expect(normalizeResumeText(input)).toBe(
      "John Doe Software Engineer",
    );
  });

  it("normalizes Windows line endings", () => {
    const input = "John Doe\r\nSoftware Engineer\r\nNode.js";

    expect(normalizeResumeText(input)).toBe(
      "John Doe\nSoftware Engineer\nNode.js",
    );
  });

  it("removes excessive blank lines", () => {
    const input = "John Doe\n\n\n\nSoftware Engineer";

    expect(normalizeResumeText(input)).toBe(
      "John Doe\nSoftware Engineer",
    );
  });

  it("removes empty lines and trims content", () => {
    const input = "\n\n  John Doe  \n\n  Node.js  \n\n";

    expect(normalizeResumeText(input)).toBe(
      "John Doe\nNode.js",
    );
  });

  it("preserves technical names", () => {
    const input = `
      C++
      C#
      .NET
      Node.js
      Next.js
    `;

    expect(normalizeResumeText(input)).toBe(
      "C++\nC#\n.NET\nNode.js\nNext.js",
    );
  });

  it("normalizes Unicode using NFKC", () => {
    const input = "Ａｎａｌｙｓｉｓ";

    expect(normalizeResumeText(input)).toBe("Analysis");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeResumeText("   \n\n\t  ")).toBe("");
  });
});
