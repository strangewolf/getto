"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  allow: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGuard({ allow, children, fallback = null }: Props) {
  const { me } = useAuth();
  if (!me) return null;
  const ok = me.roles.some((r) => allow.includes(r));
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
