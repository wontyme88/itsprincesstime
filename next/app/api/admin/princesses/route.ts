import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { genUniqueInviteCode } from "@/lib/inviteCode";

/**
 * POST /api/admin/princesses
 * body: {
 *   id: string,                  // 슬러그 (예: "rose_diary")
 *   displayName: string,
 *   avatarUrl?: string,
 *   bio?: string,
 *   themeColor?: string,
 *   personality?: {
 *     mbti?, vibe?, emojis?, tone?, commentStyle?, dmStyle?, likeStyle?, feedMood?
 *   },
 *   initialPosts?: Array<{ text: string, emoji?: string, imageUrl?: string }>
 * }
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }

  const id = String(body?.id || "").trim();
  const displayName = String(body?.displayName || "").trim();
  if (!id || !displayName) {
    return NextResponse.json({ ok: false, error: "MissingFields" }, { status: 400 });
  }
  if (!/^[a-z0-9_]{2,32}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "InvalidId" }, { status: 400 });
  }

  const existing = await prisma.princess.findUnique({ where: { id }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "AlreadyExists" }, { status: 409 });
  }

  const inviteCode = await genUniqueInviteCode(6);

  const personality = body?.personality && typeof body.personality === "object" ? body.personality : {};
  const initialPosts: Array<{ text?: string; emoji?: string; imageUrl?: string }> = Array.isArray(body?.initialPosts)
    ? body.initialPosts
    : [];

  const princess = await prisma.princess.create({
    data: {
      id,
      displayName,
      avatarUrl: body?.avatarUrl ?? null,
      bio: body?.bio ?? null,
      themeColor: body?.themeColor ?? null,
      personality,
      inviteCode,
      isDefault: false
    }
  });

  if (initialPosts.length) {
    const base = Date.now();
    for (let i = 0; i < initialPosts.length; i++) {
      const p = initialPosts[i]!;
      await prisma.princessPost.create({
        data: {
          princessId: id,
          imageUrl: p.imageUrl ?? null,
          emoji: p.emoji ?? null,
          text: String(p.text ?? ""),
          comments: [],
          position: i,
          createdAt: new Date(base + i * 1000)
        }
      });
    }
  }

  return NextResponse.json({ ok: true, princess, inviteCode });
}

/**
 * GET /api/admin/princesses
 *   → 모든 캐릭터 (관리자용, 코드 포함)
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });
  }
  const list = await prisma.princess.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
  return NextResponse.json({ ok: true, princesses: list });
}
