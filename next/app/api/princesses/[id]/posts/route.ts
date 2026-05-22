import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // 보유 여부 확인 (기본 공주 OR 초대받은 공주)
  const princess = await prisma.princess.findUnique({
    where: { id: params.id },
    select: { isDefault: true }
  });
  if (!princess) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });
  if (!princess.isDefault) {
    const rel = await prisma.userPrincessRelation.findUnique({
      where: { userId_princessId: { userId, princessId: params.id } },
      select: { userId: true }
    });
    if (!rel) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "30", 10) || 30));
  const cursorStr = url.searchParams.get("cursor");
  const cursor = cursorStr ? new Date(cursorStr) : null;

  const posts = await prisma.princessPost.findMany({
    where: {
      princessId: params.id,
      ...(cursor && !isNaN(cursor.getTime()) ? { createdAt: { lt: cursor } } : {})
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1
  });

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit).map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    imageUrls: p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
    emoji: p.emoji,
    text: p.text,
    comments: Array.isArray(p.comments) ? p.comments : [],
    createdAt: p.createdAt.toISOString()
  }));

  return NextResponse.json({
    ok: true,
    items,
    nextCursor: hasMore ? items[items.length - 1]?.createdAt ?? null : null
  });
}
