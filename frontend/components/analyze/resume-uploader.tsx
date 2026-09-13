"use client";

import { useState, useRef } from "react";
import { resumeApi } from "@/lib/api/resume.api";
import { ApiError } from "@/lib/api/client";
import type { Resume } from "@/lib/api/types";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

interface ResumeUploaderProps {
  uploadedResume: Resume | null;
  onUploadSuccess: (resume: Resume) => void;
  onReset: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ResumeUploader({
  uploadedResume,
  onUploadSuccess,
  onReset,
  disabled = false,
}: ResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // Validate PDF mime type or extension
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMessage("Only PDF resumes are supported. Please upload a PDF file.");
      setSelectedFile(null);
      return false;
    }

    // Validate size limit (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a PDF under ${MAX_FILE_SIZE_MB}MB.`
      );
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploadedResume) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploadedResume) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const response = await resumeApi.upload(selectedFile);
      onUploadSuccess(response.resume);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "INVALID_FILE_TYPE") {
          setErrorMessage("Only PDF resumes are supported.");
        } else if (err.code === "RESUME_EXTRACTION_FAILED") {
          setErrorMessage("We couldn't read this PDF. Please upload a text-based PDF.");
        } else if (err.status === 413) {
          setErrorMessage("File is too large. Please upload a smaller PDF.");
        } else {
          setErrorMessage(err.message || "Failed to upload resume. Please try again.");
        }
      } else {
        setErrorMessage("Network error during upload. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onReset();
  };

  // State: Resume Already Uploaded
  if (uploadedResume) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Resume Uploaded
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {uploadedResume.fileName}
              </p>
              <p className="text-xs text-zinc-500">Ready for career matching</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <X className="h-3.5 w-3.5" />
            Change File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading || disabled}
      />

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-zinc-900 bg-zinc-100/80 dark:border-zinc-100 dark:bg-zinc-800/60"
            : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
        } ${isUploading || disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs dark:bg-zinc-800 mb-3 text-zinc-600 dark:text-zinc-300">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Click to upload or drag and drop
        </p>
        <p className="mt-1 text-xs text-zinc-500">PDF documents only (max {MAX_FILE_SIZE_MB}MB)</p>
      </div>

      {/* Selected File Stage */}
      {selectedFile && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-500">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Resume"
              )}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

