"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ResumeUploader } from "@/components/analyze/resume-uploader";
import { CareerSelector } from "@/components/analyze/career-selector";
import type { Career, Resume } from "@/lib/api/types";
import { analysisApi } from "@/lib/api/analysis.api";
import { ApiError } from "@/lib/api/client";
import {
  FileText,
  Briefcase,
  Play,
  Check,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function AnalyzePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const canStartAnalysis = !!uploadedResume && !!selectedCareer;

  const handleStartAnalysis = async () => {
    if (!canStartAnalysis || isStarting) return;
    setIsStarting(true);
    setStartError(null);
    setIsDuplicate(false);
    try {
      const response = await analysisApi.create({
        resumeId: uploadedResume.id,
        careerId: selectedCareer.id,
      });

      // Safely support both direct { id, ... } or wrapped { analysis: { id, ... } } response envelopes
      const targetId =
        (response as unknown as { id?: string; analysis?: { id: string } })?.id ||
        (response as unknown as { id?: string; analysis?: { id: string } })?.analysis?.id;

      if (!targetId) {
        throw new Error("Unable to identify created analysis record.");
      }

      await queryClient.invalidateQueries({ queryKey: ["analyses"] });
      router.push(`/analysis/${targetId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409 || error.code === "DUPLICATE_ANALYSIS") {
          setIsDuplicate(true);
          setStartError(
            error.message ||
              "An active analysis is already in progress for this resume and career combination.",
          );
        } else if (error.status === 400 || error.code === "VALIDATION_ERROR") {
          setStartError(
            error.message ||
              "Invalid resume or career selection. Please check your inputs and try again.",
          );
        } else if (error.status === 404) {
          setStartError(
            error.message ||
              "The selected resume or career could not be found. Please refresh and try again.",
          );
        } else if (error.status >= 500) {
          setStartError(
            "A server error occurred while starting the analysis. Please try again later.",
          );
        } else {
          setStartError(error.message || "Unable to start the analysis. Please try again.");
        }
      } else if (error instanceof Error) {
        setStartError(error.message);
      } else {
        setStartError("Unable to connect to the server. Please check your connection.");
      }
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Analyze Your Resume
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Upload your resume PDF and select your target career profile to discover your skills gap.
        </p>
      </div>

      {/* Visual Step Indicator */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-xs sm:text-sm font-medium transition-colors ${
            uploadedResume
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300"
              : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              uploadedResume
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {uploadedResume ? <Check className="h-3.5 w-3.5" /> : "1"}
          </span>
          <span className="truncate">1. Upload Resume</span>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-xs sm:text-sm font-medium transition-colors ${
            selectedCareer
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300"
              : uploadedResume
              ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-600"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              selectedCareer
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : uploadedResume
                ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
            }`}
          >
            {selectedCareer ? <Check className="h-3.5 w-3.5" /> : "2"}
          </span>
          <span className="truncate">2. Choose Career</span>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-xs sm:text-sm font-medium transition-colors ${
            canStartAnalysis
              ? "border-zinc-900 bg-zinc-900/5 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-100/10 dark:text-zinc-100"
              : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-600"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              canStartAnalysis
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
            }`}
          >
            3
          </span>
          <span className="truncate">3. Start Analysis</span>
        </div>
      </div>

      {/* Step 1: Upload Resume Section */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <FileText className="h-4 w-4 text-zinc-500" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Step 1: Upload Your Resume
          </h2>
        </div>
        <p className="text-xs text-zinc-500">
          Select a PDF file containing your work history, skills, and experience.
        </p>

        <ResumeUploader
          uploadedResume={uploadedResume}
          onUploadSuccess={(resume) => setUploadedResume(resume)}
          onReset={() => setUploadedResume(null)}
        />
      </section>

      {/* Step 2: Choose Career Section */}
      <section
        className={`rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4 transition-opacity ${
          !uploadedResume ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-zinc-500" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Step 2: Choose Target Career
            </h2>
          </div>
          {selectedCareer && (
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Selected: <strong className="text-zinc-900 dark:text-zinc-100">{selectedCareer.name}</strong>
            </span>
          )}
        </div>

        {!uploadedResume ? (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            <Info className="h-4 w-4 shrink-0 text-zinc-400" />
            <span>Please upload your resume in Step 1 first to unlock career selection.</span>
          </div>
        ) : (
          <CareerSelector
            selectedCareerId={selectedCareer?.id || null}
            onSelectCareer={(career) => setSelectedCareer(career)}
          />
        )}
      </section>

      {/* Step 3: Action Bar & Start Analysis */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        {startError && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-medium">{startError}</p>
              {isDuplicate && (
                <p className="mt-2 text-xs">
                  <Link
                    href="/dashboard"
                    className="font-semibold underline hover:text-red-900 dark:hover:text-red-200"
                  >
                    View your existing analyses on Dashboard &rarr;
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Step 3: Ready for Analysis
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {canStartAnalysis
                ? `Ready to match "${uploadedResume.fileName}" against ${selectedCareer.name}.`
                : !uploadedResume
                ? "Upload your resume in Step 1 to begin."
                : "Select your target career in Step 2."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={!canStartAnalysis || isStarting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Starting analysis...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Analysis</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
