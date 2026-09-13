import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { extractResumeText } from "../src/utils/resume-text";

describe("extractResumeText", () => {
  it("extracts readable text from a PDF", async () => {
    const buffer = await readFile(
      "tests/fixtures/sample-resume.pdf",
    );

    const text = await extractResumeText(buffer);

    expect(text).toContain("Yeaish Jahan Turj");
    expect(text).toContain("Education");
    expect(text).toContain("Experience");
    expect(text).toContain("Node.js");
    expect(text).toContain("PostgreSQL");
    expect(text).toContain("Docker");
  });

  it("rejects an empty buffer", async () => {
    await expect(
      extractResumeText(Buffer.alloc(0)),
    ).rejects.toMatchObject({
      code: "EMPTY_FILE",
      statusCode: 400,
    });
  });

  it("rejects invalid PDF data", async () => {
    const invalidPdf = Buffer.from(
      "This is not a PDF file.",
      "utf8",
    );

    await expect(
      extractResumeText(invalidPdf),
    ).rejects.toMatchObject({
      code: "RESUME_EXTRACTION_FAILED",
      statusCode: 422,
    });
  });
});
