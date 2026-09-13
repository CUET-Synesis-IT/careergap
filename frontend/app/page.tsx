"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  FileText,
  Briefcase,
  Cpu,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const getStartedHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              CG
            </span>
            CareerGap
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
            AI Extraction + Verified Human Review
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Find the gap between your skills and your target career.
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Upload your resume. Choose a target career. Get an AI-analyzed, human-verified breakdown
            of the skills you have and what you need next.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 pt-4">
            <Link
              href={getStartedHref}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
            >
              Analyze Your Resume
              <ArrowRight className="h-4 w-4" />
            </Link>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:w-auto"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-zinc-200 bg-white px-4 py-20 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              From upload to verified report in four transparent steps.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-semibold text-sm">
                1
              </div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                Upload Resume
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Upload your PDF resume. Text is extracted directly without storing raw document files.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-semibold text-sm">
                2
              </div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-500" />
                Choose Career
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Select your target career path from our predefined, industry-standard skill catalogs.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-semibold text-sm">
                3
              </div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-zinc-500" />
                AI Analysis
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                AI extracts technical skills and our deterministic engine computes matched vs missing requirements.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-semibold text-sm">
                4
              </div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-zinc-500" />
                Human Review
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                An expert reviewer audits the AI result, corrects any discrepancies, and approves the final score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Built for Accuracy & Speed</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Cost-conscious AI engineering coupled with human accountability.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">AI-Powered Skill Extraction</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Targeted LLM prompts extract explicit technical skills from your resume with canonical normalization.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Deterministic Gap Scoring</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Math, not hallucinations: match percentage and missing skills are computed deterministically.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Human-in-the-Loop Quality</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Human reviewers hold exclusive claim locks to audit and correct AI determinations before publication.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Predefined Career Catalog</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Consistent skill profiles across key software and data roles, cached in Redis for fast retrieval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Careers Section */}
      <section className="border-t border-zinc-200 bg-white px-4 py-20 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Supported Career Profiles</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Analyze your readiness against these core industry engineering profiles.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: "Backend Engineer", desc: "APIs, databases, server systems" },
              { name: "Frontend Engineer", desc: "Web interfaces, client apps, UI" },
              { name: "AI/ML Engineer", desc: "Models, pipelines, ML systems" },
              { name: "DevOps Engineer", desc: "CI/CD, cloud infra, containers" },
              { name: "Data Engineer", desc: "Pipelines, storage, analytics" },
            ].map((career) => (
              <div
                key={career.name}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <h3 className="font-semibold text-base mb-1.5">{career.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{career.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Available
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="px-4 py-20 sm:px-6 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to discover your career skill gap?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Upload your resume now and get your verified breakdown.
          </p>
          <div className="pt-2">
            <Link
              href={getStartedHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-8 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        <p>© {new Date().getFullYear()} CareerGap. Built with Next.js, Express, PostgreSQL & Redis.</p>
      </footer>
    </div>
  );
}
