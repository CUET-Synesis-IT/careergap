import multer from "multer";
import { env } from "../config/env";
import { AppError } from "./error.middleware";

const maxFileSize = env.MAX_RESUME_SIZE_MB * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback,
) => {
  const isPdf =
    file.mimetype === "application/pdf" &&
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    callback(
      new AppError(
        "Only PDF files are supported.",
        400,
        "INVALID_FILE_TYPE",
      ),
    );
    return;
  }

  callback(null, true);
};

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
  fileFilter,
}).single("file");
