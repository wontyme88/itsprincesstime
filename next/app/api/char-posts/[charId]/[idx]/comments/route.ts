import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({ text: z.string().min(1).max(2000) });

export async function GET(
  _req: Request,
  { params }: { params: { charId: string; idx: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const postIdx = parseInt(params.idx, 10);
  if (!Number.isInteger(postIdx)) return NextResponse.json({ ok: false }, { status: 400 });

  const list = await prisma.charPostComment.findMany({
    where: { userId, charId: params.charId, postIdx },
    orderBy: { createdAt: "asc" },
    include: { replies: { orderBy: { createdAt: "asc" } } }
  });
  return NextResponse.json({
    ok: true,
    comments: list.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      replies: c.replies.map((r) => ({
        id: r.id,
        fromMe: r.fromMe,
        princessId: r.princessId,
        text: r.text,
        createdAt: r.createdAt
      }))
    }))
  });
}

export async function POST(
  req: Request,
  { params }: { params: { charId: string; idx: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`cpc:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  const postIdx = parseInt(params.idx, 10);
  if (!Number.isInteger(postIdx)) return NextResponse.json({ ok: false }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const c = await prisma.charPostComment.create({
    data: {
      userId,
      charId: params.charId,
      postIdx,
      text: parsed.data.text
    }
  });
  return NextResponse.json({ ok: true, comment: { id: c.id, createdAt: c.createdAt } });
}
