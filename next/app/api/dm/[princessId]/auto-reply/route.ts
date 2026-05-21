import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PersonalityShape = {
  frequentPhrases?: string[];
  reactionPatterns?: { examples?: string[] };
  igActivity?: { dmStyle?: string };
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(
  _req: Request,
  { params }: { params: { princessId: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const princess = await prisma.princess.findUnique({ where: { id: params.princessId } });
  if (!princess) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const personality = (princess.personality as PersonalityShape | null) ?? {};
  const pool = [
    ...(personality.frequentPhrases ?? []),
    ...(personality.reactionPatterns?.examples ?? [])
  ].filter(Boolean);
  if (pool.length === 0) {
    return NextResponse.json({ ok: true, message: null });
  }
  const text = pickRandom(pool);

  const thread = await prisma.directMessageThread.upsert({
    where: { userId_princessId: { userId, princessId: princess.id } },
    create: { userId, princessId: princess.id },
    update: {}
  });
  const msg = await prisma.directMessage.create({
    data: { threadId: thread.id, fromMe: false, text }
  });
  await prisma.directMessageThread.update({
    where: { id: thread.id },
    data: { unread: { increment: 1 }, updatedAt: new Date() }
  });

  return NextResponse.json({ ok: true, message: { id: msg.id, text, createdAt: msg.createdAt } });
}
