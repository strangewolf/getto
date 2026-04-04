import { NextResponse } from "next/server";
import { requireAuth, handleRouteError } from "@/lib/server/http";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      org_id: user.orgId,
      roles: user.roles,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
