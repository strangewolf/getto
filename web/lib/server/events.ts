import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function appendEvent(
  tx: Prisma.TransactionClient,
  eventType: string,
  payload: Prisma.InputJsonValue | null,
  orgId: string | null,
  actorUserId: string | null,
) {
  await tx.businessEvent.create({
    data: {
      eventType,
      payload: payload ?? undefined,
      orgId: orgId ?? undefined,
      actorUserId: actorUserId ?? undefined,
    },
  });
}

/** Outside transactions */
export async function appendEventDirect(
  eventType: string,
  payload: Prisma.InputJsonValue | null,
  orgId: string | null,
  actorUserId: string | null,
) {
  await appendEvent(prisma, eventType, payload, orgId, actorUserId);
}
