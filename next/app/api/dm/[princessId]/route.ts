import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const sendSchema = z.object({
  fromMe: z.boolean(),
  text: z.string().min(1).max(2000)
});

async function ensureThread(userId: string, princessId: string) {
  const princess = await prisma.princess.findUnique({ where: { id: princessId } });
  if (!princess) return null;
  return prisma.directMessageThread.upsert({
    where: { userId_princessId: { userId, princessId } },
    create: { userId, princessId },
    update: {}
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { princessId: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const thread = await prisma.directMessageThread.findUnique({
    where: { userId_princessId: { userId, princessId: params.princessId } },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } }
  });
  if (!thread) {
    return NextResponse.json({ ok: true, princessId: params.princessId, messages: [] });
  }
  return NextResponse.json({
    ok: true,
    princessId: thread.princessId,
    unread: thread.unread,
    messages: thread.messages.map((m) => ({
      id: m.id,
      fromMe: m.fromMe,
      text: m.text,
      createdAt: m.createdAt
    }))
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { princessId: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await prisma.directMessageThread.deleteMany({
    where: { userId, princessId: params.princessId }
  });
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: Request,
  { params }: { params: { princessId: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`dm:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  const thread = await ensureThread(userId, params.princessId);
  if (!thread) return NextResponse.json({ ok: false, error: "UnknownPrincess" }, { status: 404 });

  const msg = await prisma.directMessage.create({
    data: { threadId: thread.id, fromMe: parsed.data.fromMe, text: parsed.data.text }
  });
  await prisma.directMessageThread.update({
    where: { id: thread.id },
    data: parsed.data.fromMe ? { updatedAt: new Date() } : { unread: { increment: 1 }, updatedAt: new Date() }
  });
  return NextResponse.json({
    ok: true,
    message: { id: msg.id, createdAt: msg.createdAt }
  });
}
