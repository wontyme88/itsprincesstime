import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
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
