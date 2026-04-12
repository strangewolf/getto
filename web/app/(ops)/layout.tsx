"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace("/login");
  }, [loading, me, router]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#060010] px-4 text-center text-zinc-400">
        Loading…
      </div>
    );
  }
  if (!me) return null;

  return <AppShell>{children}</AppShell>;
}
