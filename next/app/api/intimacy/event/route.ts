import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weightFor, type IntimacyAction } from "@/lib/intimacy";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const ACTIONS = [
  "like",
  "comment",
  "reply",
  "dm_send",
  "dm_receive",
  "post_view",
  "profile_view",
  "moderation_yes",
  "moderation_no",
  "inappropriate"
] as const;

const schema = z.object({
  princessId: z.string().min(1).max(64),
  action: z.enum(ACTIONS),
  delta: z.number().int().min(-50).max(50).optional() // 가중치 override (선택)
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`intimacy:${userId}:${ip}`, 60, 60_000); // 분당 60회
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }

  // 공주 존재 확인 (오타 방지)
  const princess = await prisma.princess.findUnique({
    where: { id: parsed.data.princessId },
    select: { id: true }
  });
  if (!princess) {
    return NextResponse.json({ ok: false, error: "UnknownPrincess" }, { status: 404 });
  }

  const delta = parsed.data.delta ?? Math.round(weightFor(parsed.data.action as IntimacyAction));

  const updated = await prisma.userPrincessRelation.upsert({
    where: {
      userId_princessId: {
        userId,
        princessId: parsed.data.princessId
      }
    },
    create: {
      userId,
      princessId: parsed.data.princessId,
      intimacy: delta,
      lastInteractedAt: new Date()
    },
    update: {
      intimacy: { increment: delta },
      lastInteractedAt: new Date()
    }
  });

  return NextResponse.json({
    ok: true,
    princessId: updated.princessId,
    intimacy: updated.intimacy,
    delta
  });
}
