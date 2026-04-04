"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, me, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@getto.demo");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && me) router.replace("/dashboard");
  }, [loading, me, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email, password);
    } catch {
      setErr("Invalid email or password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center bg-zinc-100 px-4 py-8 dark:bg-zinc-950"
      style={{
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        paddingTop: "max(2rem, env(safe-area-inset-top))",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-balance text-xl font-bold tracking-tight text-emerald-800 sm:text-2xl dark:text-emerald-400">
          Smart Login Portal
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Sign in to operations</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {err ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{err}</div> : null}
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-lg bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 sm:min-h-0 sm:py-2.5"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-zinc-500">Demo: admin@getto.demo / admin123</p>
      </div>
    </div>
  );
}
