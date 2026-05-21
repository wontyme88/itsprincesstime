import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST: 토글. 응답 { liked: bool, count: number }
 * GET:  현재 상태. { liked: bool, count: number }
 */
async function getState(userId: string, charId: string, postIdx: number) {
  const [row, count] = await Promise.all([
    prisma.charPostLike.findUnique({
      where: { userId_charId_postIdx: { userId, charId, postIdx } }
    }),
    prisma.charPostLike.count({ where: { charId, postIdx } })
  ]);
  return { liked: !!row, count };
}

export async function GET(
  _req: Request,
  { params }: { params: { charId: string; idx: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const postIdx = parseInt(params.idx, 10);
  if (!Number.isInteger(postIdx)) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  const state = await getState(userId, params.charId, postIdx);
  return NextResponse.json({ ok: true, ...state });
}

export async function POST(
  req: Request,
  { params }: { params: { charId: string; idx: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`cpl:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  const postIdx = parseInt(params.idx, 10);
  if (!Number.isInteger(postIdx)) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  const existing = await prisma.charPostLike.findUnique({
    where: { userId_charId_postIdx: { userId, charId: params.charId, postIdx } }
  });
  if (existing) {
    await prisma.charPostLike.delete({
      where: { userId_charId_postIdx: { userId, charId: params.charId, postIdx } }
    });
  } else {
    await prisma.charPostLike.create({
      data: { userId, charId: params.charId, postIdx }
    });
  }
  const state = await getState(userId, params.charId, postIdx);
  return NextResponse.json({ ok: true, ...state });
}
