"use client";

import React, { useMemo, useState } from "react";
import { MatchGaugeChart } from "@/components/analysis/match-gauge-chart";
import type { Career, SkillImportance } from "@/lib/api/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FinalResultSectionProps {
  finalMatchPercentage: number;
  finalMatchedSkills: (
    | string
    | { name: string; importance?: SkillImportance }
  )[];
  finalMissingSkills: (
    | string
    | { name: string; importance?: SkillImportance }
  )[];
  aiMatchPercentage?: number | null;
  aiMatchedSkills?:
    | (string | { name: string; importance?: SkillImportance })[]
    | null;
  aiMissingSkills?:
    | (string | { name: string; importance?: SkillImportance })[]
    | null;
  career?: Career;
}

function resolveSkill(
  item: string | { name: string; importance?: SkillImportance },
  importanceMap: Map<string, SkillImportance>,
): { name: string; importance?: SkillImportance } {
  if (typeof item === "object" && item !== null && "name" in item) {
    const rawName = item.name;
    const importance =
      item.importance || importanceMap.get(rawName.trim().toLowerCase());
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

export function FinalResultSection({
  finalMatchPercentage,
  finalMatchedSkills,
  finalMissingSkills,
  aiMatchPercentage,
  aiMatchedSkills = [],
  aiMissingSkills = [],
  career,
}: FinalResultSectionProps) {
  const [showAiBaseline, setShowAiBaseline] = useState(false);

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

  const parsedFinalMatched = useMemo(
    () => finalMatchedSkills.map((s) => resolveSkill(s, importanceMap)),
    [finalMatchedSkills, importanceMap],
  );

  const parsedFinalMissing = useMemo(
    () => finalMissingSkills.map((s) => resolveSkill(s, importanceMap)),
    [finalMissingSkills, importanceMap],
  );

  const parsedAiMatched = useMemo(
    () => (aiMatchedSkills || []).map((s) => resolveSkill(s, importanceMap)),
    [aiMatchedSkills, importanceMap],
  );

  const parsedAiMissing = useMemo(
    () => (aiMissingSkills || []).map((s) => resolveSkill(s, importanceMap)),
    [aiMissingSkills, importanceMap],
  );

  const roundedFinalMatch = finalMatchPercentage;
  const roundedAiMatch =
    aiMatchPercentage !== null && aiMatchPercentage !== undefined
      ? aiMatchPercentage
      : null;

  // Score delta between human verified and original AI
  const scoreDelta =
    roundedAiMatch !== null ? roundedFinalMatch - roundedAiMatch : null;

  return (
    <div className="space-y-8">
      {/* Verified Header Banner (Visually Distinguished) */}
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-xs dark:border-emerald-900/80 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                Verified Final Result
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950">
                <CheckCircle2 className="h-3 w-3" />
                Human Verified
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed max-w-3xl">
              This analysis has been reviewed, validated, and finalized by a
              verified expert reviewer. The scores and skill classifications
              below represent your official completed assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Main Verified Match Card with Gauge Chart */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-around">
          {/* Recharts Gauge Chart */}
          <div className="flex flex-col items-center">
            <MatchGaugeChart
              percentage={roundedFinalMatch}
              label="Final Verified"
              size={190}
            />
          </div>

          {/* Breakdown & Comparison Metrics */}
          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Matched</span>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                {parsedFinalMatched.length}
              </p>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Verified Missing</span>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
                {parsedFinalMissing.length}
              </p>
            </div>

            {/* AI Comparison Badge */}
            {scoreDelta !== null && (
              <div className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>
                    Initial AI score was{" "}
                    <strong>{roundedAiMatch.toFixed(1)}%</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold">
                  {scoreDelta > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" />+
                      {scoreDelta.toFixed(1)}% improvement
                    </span>
                  ) : scoreDelta < 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {scoreDelta.toFixed(1)}% calibrated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-zinc-500">
                      <Minus className="h-3.5 w-3.5" />
                      Unchanged from AI
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Verified Skills Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Verified Matched Skills */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Verified Matched Skills ({parsedFinalMatched.length})
            </h3>
            <span className="text-[11px] text-zinc-400">
              Approved by reviewer
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {parsedFinalMatched.length > 0 ? (
              parsedFinalMatched.map(({ name, importance }) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  <span>{name}</span>
                  <ImportanceBadge importance={importance} />
                </span>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-2">
                No matching skills confirmed for this career profile.
              </p>
            )}
          </div>
        </section>

        {/* Verified Missing Skills */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Verified Missing Skills ({parsedFinalMissing.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Action items</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {parsedFinalMissing.length > 0 ? (
              parsedFinalMissing.map(({ name, importance }) => (
                <span
                  key={name}
                  className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    importance === "HIGH"
                      ? "border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 font-semibold"
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
                Congratulations! You meet all required skills verified for this
                role.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Optional Accordion: View Original AI Assessment Baseline */}
      {roundedAiMatch !== null && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAiBaseline((prev) => !prev)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>
                Original AI Baseline Assessment ({roundedAiMatch.toFixed(1)}%)
              </span>
            </div>
            {showAiBaseline ? (
              <ChevronUp className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            )}
          </button>

          {showAiBaseline && (
            <div className="px-5 pb-5 pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
              <p className="text-xs text-zinc-500">
                Initial evaluation produced automatically by the AI model prior
                to human reviewer verification.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    AI Matched ({parsedAiMatched.length}):
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {parsedAiMatched.map((s) => (
                      <span
                        key={s.name}
                        className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    AI Missing ({parsedAiMissing.length}):
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {parsedAiMissing.map((s) => (
                      <span
                        key={s.name}
                        className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
