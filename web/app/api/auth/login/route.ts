import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAccessToken, verifyPassword } from "@/lib/auth";
import { readJson, handleRouteError } from "@/lib/server/http";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = await readJson<Body>(req);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }
    const token = await createAccessToken(user.id);
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch (e) {
    return handleRouteError(e);
  }
}
