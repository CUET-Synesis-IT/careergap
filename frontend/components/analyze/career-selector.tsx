"use client";

import { useQuery } from "@tanstack/react-query";
import { careerApi } from "@/lib/api/career.api";
import type { Career } from "@/lib/api/types";
import { Briefcase, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface CareerSelectorProps {
  selectedCareerId: string | null;
  onSelectCareer: (career: Career) => void;
  disabled?: boolean;
}

export function CareerSelector({
  selectedCareerId,
  onSelectCareer,
  disabled = false,
}: CareerSelectorProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["careers"],
    queryFn: () => careerApi.getAll(),
  });

  const careers: Career[] = data?.careers || [];

  if (isLoading) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <p className="mt-2 text-xs text-zinc-500">Loading available careers...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        <AlertCircle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400 mb-2" />
        <p className="font-semibold">Unable to load career catalog</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-900 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (careers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        <Briefcase className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
        <p>No career profiles currently available.</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {careers.map((career) => {
        const isSelected = selectedCareerId === career.id;
        return (
          <div
            key={career.id}
            onClick={() => onSelectCareer(career)}
            className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
              isSelected
                ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-100/10 dark:ring-zinc-100 shadow-xs"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {career.name}
                </h3>
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-700" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {career.description}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
              <span className="font-mono text-[10px] uppercase text-zinc-400">
                {career.slug}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

