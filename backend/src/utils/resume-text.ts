import { PDFParse } from "pdf-parse";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";

const MIN_RESUME_TEXT_LENGTH = 50;

export async function extractResumeText(
  buffer: Buffer,
): Promise<string> {
  if (!buffer.length) {
    throw new AppError(
      "The uploaded resume file is empty.",
      400,
      "EMPTY_FILE",
    );
  }

  let parser: PDFParse | undefined;

  try {
    parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();
    const normalizedText = normalizeResumeText(result.text);

    if (!hasMeaningfulResumeText(normalizedText)) {
      throw new AppError(
        "Unable to extract readable text from this resume. Please upload a text-based PDF.",
        422,
        "RESUME_EXTRACTION_FAILED",
      );
    }

    if (normalizedText.length > env.MAX_RESUME_TEXT_CHARS) {
      throw new AppError(
        `Resume text must not exceed ${env.MAX_RESUME_TEXT_CHARS} characters.`,
        422,
        "RESUME_TEXT_TOO_LONG",
      );
    }

    return normalizedText;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Resume PDF parsing failed:", error);

    throw new AppError(
      "Unable to read this PDF.",
      422,
      "RESUME_EXTRACTION_FAILED",
    );
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

export function normalizeResumeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function hasMeaningfulResumeText(text: string): boolean {
  if (text.length < MIN_RESUME_TEXT_LENGTH) {
    return false;
  }

  const meaningfulCharacters = text.match(
    /[\p{L}\p{N}]/gu,
  );

  if (!meaningfulCharacters) {
    return false;
  }

  return meaningfulCharacters.length >= MIN_RESUME_TEXT_LENGTH;
}
