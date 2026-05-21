import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PersonalityShape = {
  reactionPatterns?: { examples?: string[] };
  frequentPhrases?: string[];
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findFirst({ where: { id: params.id, userId } });
  if (!post) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const princesses = await prisma.princess.findMany();
  if (princesses.length === 0) {
    return NextResponse.json({ ok: true, comments: [] });
  }

  // Pick 1~2 random princesses to comment
  const count = Math.random() < 0.5 ? 1 : 2;
  const shuffled = [...princesses].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, Math.min(count, princesses.length));

  const created = [];
  for (const p of picks) {
    const personality = (p.personality as PersonalityShape | null) ?? {};
    const candidates =
      personality.reactionPatterns?.examples?.filter(Boolean) ??
      personality.frequentPhrases?.filter(Boolean) ??
      [];
    if (candidates.length === 0) continue;
    const text = pickRandom(candidates);
    const c = await prisma.diaryComment.create({
      data: {
        postId: post.id,
        princessId: p.id,
        text,
        authorUserId: null
      }
    });
    created.push({ id: c.id, princessId: p.id, text });
  }

  return NextResponse.json({ ok: true, comments: created });
}
