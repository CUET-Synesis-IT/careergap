"use client";

import React, { useMemo } from "react";
import { MatchGaugeChart } from "@/components/analysis/match-gauge-chart";
import type { Career, SkillImportance } from "@/lib/api/types";
import {
  Check,
  AlertCircle,
  Sparkles,
  FileCode2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface AiResultSectionProps {
  matchPercentage: number;
  matchedSkills: (string | { name: string; importance?: SkillImportance })[];
  missingSkills: (string | { name: string; importance?: SkillImportance })[];
  extractedSkills?: string[] | null;
  career?: Career;
  status: string;
}

function resolveSkill(
  item: string | { name: string; importance?: SkillImportance },
  importanceMap: Map<string, SkillImportance>,
): { name: string; importance?: SkillImportance } {
  if (typeof item === "object" && item !== null && "name" in item) {
    const rawName = item.name;
    const importance = item.importance || importanceMap.get(rawName.trim().toLowerCase());
    return { name: rawName, importance };
  }

  const name = String(item);
  const importance = importanceMap.get(name.trim().toLowerCase());
  return { name, importance };
}

function ImportanceBadge({ importance }: { importance?: SkillImportance }) {
  if (!importance) return null;

  switch (importance) {
    case "HIGH":
      return (
        <span className="ml-1.5 inline-flex items-center rounded-sm bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          Core
        </span>
      );
    case "MEDIUM":
      return (
        <span className="ml-1.5 inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Medium
        </span>
      );
    case "LOW":
      return (
        <span className="ml-1.5 inline-flex items-center rounded-sm bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Bonus
        </span>
      );
    default:
      return null;
  }
}

export function AiResultSection({
  matchPercentage,
  matchedSkills,
  missingSkills,
  extractedSkills = [],
  career,
  status,
}: AiResultSectionProps) {
  // Build importance lookup map from career profile if present
  const importanceMap = useMemo(() => {
    const map = new Map<string, SkillImportance>();
    if (career?.profile?.skills) {
      career.profile.skills.forEach((s) => {
        if (s.name && s.importance) {
          map.set(s.name.trim().toLowerCase(), s.importance);
        }
      });
    }
    return map;
  }, [career]);

  const parsedMatched = useMemo(
    () => matchedSkills.map((s) => resolveSkill(s, importanceMap)),
    [matchedSkills, importanceMap],
  );

  const parsedMissing = useMemo(
    () => missingSkills.map((s) => resolveSkill(s, importanceMap)),
    [missingSkills, importanceMap],
  );

  const safeExtracted = Array.isArray(extractedSkills) ? extractedSkills : [];

  return (
    <div className="space-y-8">
      {/* AI Header Alert */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                AI Match Evaluation
              </h2>
              {status === "REVIEW" && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Pending Human Verification
                </span>
              )}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              This score was generated automatically by evaluating your resume skills against the
              target career requirements.
              {status === "REVIEW" &&
                " A reviewer will verify these matches and publish the final result."}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Card with Recharts Gauge Chart */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-around">
          {/* Match Chart */}
          <div className="flex flex-col items-center">
            <MatchGaugeChart
              percentage={matchPercentage}
              label="AI Match"
              size={180}
            />
          </div>

          {/* Key Metrics Breakdown */}
          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Matched Skills</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {parsedMatched.length}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <XCircle className="h-4 w-4 text-amber-600" />
                <span>Missing Skills</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {parsedMissing.length}
              </p>
            </div>

            <div className="col-span-2 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <FileCode2 className="h-4 w-4 text-blue-600" />
                <span>Total Skills Extracted from Resume</span>
              </div>
              <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {safeExtracted.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Matched vs Missing Skills Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Matched Skills */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              Matched Skills ({parsedMatched.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Found in resume</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {parsedMatched.length > 0 ? (
              parsedMatched.map(({ name, importance }) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  <span>{name}</span>
                  <ImportanceBadge importance={importance} />
                </span>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-2">
                No matching skills detected in your resume for this career profile.
              </p>
            )}
          </div>
        </section>

        {/* Missing Skills */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Missing Skills ({parsedMissing.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Needed for role</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {parsedMissing.length > 0 ? (
              parsedMissing.map(({ name, importance }) => (
                <span
                  key={name}
                  className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    importance === "HIGH"
                      ? "border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 font-semibold"
                      : "border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                  }`}
                >
                  <AlertCircle
                    className={`mr-1.5 h-3.5 w-3.5 ${
                      importance === "HIGH" ? "text-rose-600" : "text-amber-600"
                    }`}
                  />
                  <span>{name}</span>
                  <ImportanceBadge importance={importance} />
                </span>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-2">
                No missing skills identified! Your resume covers all specified skills for this role.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Extracted Resume Skills */}
      {safeExtracted.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-zinc-500" />
              Extracted Resume Skills ({safeExtracted.length})
            </h3>
            <span className="text-[11px] text-zinc-400">All skills detected by AI</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {safeExtracted.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
