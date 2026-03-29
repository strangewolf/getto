"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch, getToken, setToken } from "@/lib/api";

export type Me = {
  id: string;
  email: string;
  full_name: string;
  org_id: string;
  roles: string[];
};

type AuthContextValue = {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const u = await apiFetch<Me>("/auth/me");
      setMe(u);
    } catch {
      setToken(null);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    if (!me && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
    }
  }, [loading, me, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<{ access_token: string }>("/auth/login", {
        method: "POST",
        json: { email, password },
      });
      setToken(res.access_token);
      await refresh();
      router.replace("/dashboard");
    },
    [refresh, router]
  );

  const logout = useCallback(() => {
    setToken(null);
    setMe(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ me, loading, login, logout, refresh }),
    [me, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
