"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  label: string;
  description?: string;
  placeholder?: string;
  variant?: "emerald" | "rose" | "zinc";
  disabled?: boolean;
  errorMessage?: string;
}

export function SkillsTagInput({
  skills,
  onChange,
  label,
  description,
  placeholder = "Type skill and press enter...",
  variant = "zinc",
  disabled = false,
  errorMessage,
}: SkillsTagInputProps) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    // Prevent duplicates case-insensitively
    const exists = skills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      onChange([...skills, trimmed]);
    }
    setInputVal("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (disabled) return;
    onChange(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const tagColorClasses = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
    zinc: "border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  }[variant];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {skills.length} {skills.length === 1 ? "skill" : "skills"}
        </span>
      </div>

      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}

      {/* Rendered Chips */}
      <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
        {skills.length === 0 ? (
          <span className="text-xs italic text-zinc-400">No skills listed. Add some below.</span>
        ) : (
          skills.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium shadow-2xs transition ${tagColorClasses}`}
            >
              <span>{skill}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded-xs p-0.5 opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Input row */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputVal.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Skill
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}

