"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api/client";
import { getRoleDefaultPath } from "@/lib/auth/routes";
import { AlertCircle, User, ShieldCheck, ShieldAlert } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginMode = "USER" | "REVIEWER" | "SUPER_ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginMode>("USER");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      // Backend contract accepts { email, password } only
      const loggedInUser = await login({
        email: data.email,
        password: data.password,
      });

      // Role check against the frontend mode selected by user
      if (loggedInUser.role !== selectedRole) {
        setServerError(
          `This account has the role of ${loggedInUser.role}, but you selected ${selectedRole} mode.`
        );
        return;
      }

      // Route based on the role returned by the backend
      const targetPath = getRoleDefaultPath(loggedInUser.role);
      router.push(targetPath);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "INVALID_CREDENTIALS" || err.status === 401) {
          setServerError("Invalid email or password.");
        } else if (err.code === "ACCOUNT_INACTIVE" || err.message.toLowerCase().includes("inactive")) {
          setServerError("This reviewer account is currently inactive. Please contact an administrator.");
        } else {
          setServerError(err.message || "Unable to log in right now. Please try again.");
        }
      } else {
        setServerError("Unable to connect to the server. Please try again later.");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            CG
          </span>
          CareerGap
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to your CareerGap account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          {/* Account Type Selector (Frontend Login Mode) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Choose Account Type
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("USER");
                  setServerError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  selectedRole === "USER"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                User
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("REVIEWER");
                  setServerError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  selectedRole === "REVIEWER"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Reviewer
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("SUPER_ADMIN");
                  setServerError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  selectedRole === "SUPER_ADMIN"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
          </div>

          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <p className="flex-1">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
              <input
                type="email"
                disabled={isSubmitting}
                {...register("email")}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <input
                type="password"
                disabled={isSubmitting}
                {...register("password")}
                placeholder="Enter password"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-zinc-900 py-2.5 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </div>
          </form>

          {selectedRole === "USER" && (
            <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
