import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/invite/redeem
 * body: { code: string }
 * 해당 코드의 공주를 사용자의 보유 목록에 추가.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ ok: false, error: "NoUserId" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }
  const code = String(body?.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "InvalidCode" }, { status: 400 });
  }

  const princess = await prisma.princess.findUnique({
    where: { inviteCode: code },
    select: { id: true, displayName: true, avatarUrl: true, bio: true, themeColor: true }
  });
  if (!princess) {
    return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });
  }

  const existing = await prisma.userPrincessRelation.findUnique({
    where: { userId_princessId: { userId, princessId: princess.id } }
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "AlreadyOwned", princess }, { status: 409 });
  }

  await prisma.userPrincessRelation.create({
    data: { userId, princessId: princess.id }
  });

  return NextResponse.json({ ok: true, princess });
}
