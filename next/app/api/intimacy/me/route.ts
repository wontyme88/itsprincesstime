import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authUser = await getSessionUser();
  const userId = authUser?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.userPrincessRelation.findMany({
    where: { userId },
    orderBy: { intimacy: "desc" }
  });
  return NextResponse.json({
    ok: true,
    relations: rows.map((r) => ({
      princessId: r.princessId,
      intimacy: r.intimacy,
      lastInteractedAt: r.lastInteractedAt
    }))
  });
}
