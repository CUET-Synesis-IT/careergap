"use client";

import React from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "@/context/auth-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}

