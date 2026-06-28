import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/my/characters
 * 사용자가 보유한 공주(기본 + 초대) 목록.
 */
export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = authUser.id;
  if (!userId) return NextResponse.json({ ok: false, error: "NoUserId" }, { status: 401 });

  const relations = await prisma.userPrincessRelation.findMany({
    where: { userId },
    select: { princessId: true }
  });
  const ownedIds = relations.map((r) => r.princessId);

  const princesses = await prisma.princess.findMany({
    where: ownedIds.length
      ? { OR: [{ id: { in: ownedIds } }, { isDefault: true }] }
      : { isDefault: true },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      themeColor: true,
      isDefault: true
    },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }]
  });

  return NextResponse.json({ ok: true, characters: princesses, count: princesses.length });
}
