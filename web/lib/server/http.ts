import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeToken } from "@/lib/auth";
import { HttpError } from "@/lib/server/errors";
import type { User } from "@prisma/client";

export type AuthedUser = User & { roles: string[] };

export async function requireAuth(req: Request): Promise<AuthedUser> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new HttpError(401, "Could not validate credentials");
  }
  const token = auth.slice(7);
  let sub: string;
  try {
    ({ sub } = await decodeToken(token));
  } catch {
    throw new HttpError(401, "Could not validate credentials");
  }
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user?.isActive) throw new HttpError(401, "Could not validate credentials");
  const ur = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });
  const roles = ur.map((x) => x.role.name);
  return { ...user, roles };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

export function jsonDetail(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export function handleRouteError(e: unknown): NextResponse {
  if (e instanceof HttpError) {
    return jsonDetail(e.message, e.status);
  }
  if (e instanceof Error && e.message) {
    return jsonDetail(e.message, 400);
  }
  console.error(e);
  return jsonDetail("Internal error", 500);
}
