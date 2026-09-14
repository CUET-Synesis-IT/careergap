"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { analysisApi } from "@/lib/api/analysis.api";
import { AlertCircle, Loader2 } from "lucide-react";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["analyses", id], queryFn: () => analysisApi.getById(id), enabled: Boolean(id),
    refetchInterval: ({ state }) => ["PENDING", "PROCESSING", "REVIEW"].includes(state.data?.status ?? "") ? 5000 : false,
  });
  if (query.isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (query.isError || !query.data) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"><AlertCircle className="mb-2 h-5 w-5" />Unable to load this analysis.</div>;
  const analysis = query.data;
  const result = analysis.status === "COMPLETED" ? analysis.finalResult : analysis.aiResult;
  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">{analysis.career?.name ?? "Career analysis"}</h1><p className="mt-1 text-sm text-zinc-500">Status: {analysis.status}</p></div><Link href="/history" className="rounded-lg border px-3 py-2 text-sm">Back to history</Link></div>
    {analysis.status === "REVIEW" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Your AI analysis is ready and waiting for human verification. This page updates automatically.</div>}
    {analysis.status === "FAILED" && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">The analysis could not be completed.</div>}
    {result && <><section className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{analysis.status === "COMPLETED" ? "Verified match" : "AI match"}</p><p className="mt-2 text-5xl font-bold">{result.matchPercentage}%</p></section><div className="grid gap-5 md:grid-cols-2"><SkillList title="Matched skills" skills={result.matchedSkills} tone="green" /><SkillList title="Missing skills" skills={result.missingSkills} tone="amber" /></div></>}
  </div>;
}

function SkillList({ title, skills, tone }: { title: string; skills: string[]; tone: "green" | "amber" }) {
  return <section className="rounded-xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-semibold">{title}</h2><div className="mt-4 flex flex-wrap gap-2">{skills.length ? skills.map((skill) => <span key={skill} className={`rounded-full px-3 py-1 text-xs ${tone === "green" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{skill}</span>) : <span className="text-sm text-zinc-500">None reported</span>}</div></section>;
}
