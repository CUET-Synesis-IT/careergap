"use client";

import React, { useSyncExternalStore } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MatchGaugeChartProps {
  percentage: number;
  label?: string;
  size?: number;
  className?: string;
}

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function getMatchColor(score: number): string {
  if (score >= 70) return "#10b981"; // Emerald
  if (score >= 50) return "#3b82f6"; // Blue
  if (score >= 30) return "#f59e0b"; // Amber
  return "#ef4444"; // Red
}

export function MatchGaugeChart({
  percentage,
  label = "Match Score",
  size = 200,
  className = "",
}: MatchGaugeChartProps) {
  const isMounted = useIsClient();

  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const remaining = Math.max(0, 100 - clampedPercentage);
  const activeColor = getMatchColor(clampedPercentage);

  const data = [
    { name: "Matched", value: clampedPercentage },
    { name: "Remaining", value: remaining },
  ];

  if (!isMounted) {
    // Placeholder before client-side hydration
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {clampedPercentage.toFixed(1)}%
          </span>
          <span className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius="72%"
            outerRadius="90%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell key="matched" fill={activeColor} />
            <Cell
              key="remaining"
              fill="#e4e4e7"
              className="dark:fill-zinc-800"
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {clampedPercentage.toFixed(1)}%
        </span>
        <span className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
    </div>
  );
}
