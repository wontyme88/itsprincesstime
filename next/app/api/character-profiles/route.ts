import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/character-profiles
 * Legacy 사이트(public/legacy/index.html)가 호출.
 * 응답 형식은 legacy의 CHARACTER_PROFILES 객체와 키 호환:
 * { ok, profiles: { [charId]: { name, img, bio, posts: [{ emoji, image, caption, comments: [{id,text}] }] } } }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;

  // 사용자가 보유한 공주 + 기본 공주(아직 관계가 없는 경우에도 fallback)
  const relations = userId
    ? await prisma.userPrincessRelation.findMany({
        where: { userId },
        select: { princessId: true }
      })
    : [];
  const ownedIds = new Set(relations.map((r) => r.princessId));

  const princesses = await prisma.princess.findMany({
    where: ownedIds.size
      ? { OR: [{ id: { in: Array.from(ownedIds) } }, { isDefault: true }] }
      : { isDefault: true },
    orderBy: { id: "asc" },
    include: {
      posts: { orderBy: { position: "asc" } }
    }
  });

  const profiles: Record<string, unknown> = {};
  for (const p of princesses) {
    profiles[p.id] = {
      name: p.displayName,
      img: p.avatarUrl ?? "",
      bio: p.bio ?? "",
      posts: p.posts.map((post) => ({
        emoji: post.emoji ?? "",
        image: post.imageUrl ?? "",
        caption: post.text,
        comments: Array.isArray(post.comments) ? post.comments : []
      }))
    };
  }

  return NextResponse.json({ ok: true, profiles });
}
