import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  fromMe: z.boolean(),
  princessId: z.string().min(1).max(64).nullable().optional(),
  text: z.string().min(1).max(2000)
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`cpr:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  // 본인이 소유한 char-post-comment의 답글만 허용
  const parent = await prisma.charPostComment.findFirst({
    where: { id: params.id, userId },
    select: { id: true }
  });
  if (!parent) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const r = await prisma.charPostReply.create({
    data: {
      commentId: parent.id,
      fromMe: parsed.data.fromMe,
      princessId: parsed.data.princessId ?? null,
      text: parsed.data.text
    }
  });
  return NextResponse.json({ ok: true, reply: { id: r.id, createdAt: r.createdAt } });
}
