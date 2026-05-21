import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/**
 * GET /api/princesses
 *   → 모든 공주 목록 + 구조화된 personality
 * GET /api/princesses?id=lily_princess
 *   → 단일 공주
 * GET /api/princesses?fields=moderation,emojis
 *   → 지정 필드만
 * PUT /api/princesses?id=lily_princess  (admin only)
 *   body: { displayName?, personality?: Partial<personality JSON> }
 *   → 부분 머지 업데이트
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const fieldsParam = url.searchParams.get("fields");
  const fields = fieldsParam ? fieldsParam.split(",").map((s) => s.trim()) : null;

  if (id) {
    const p = await prisma.princess.findUnique({ where: { id } });
    if (!p) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });
    return NextResponse.json({ ok: true, princess: shapeOne(p, fields) });
  }

  const list = await prisma.princess.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({
    ok: true,
    princesses: list.map((p) => shapeOne(p, fields))
  });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "MissingId" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }
  const parsed = z
    .object({
      displayName: z.string().min(1).max(40).optional(),
      personality: z.record(z.any()).optional()
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }

  const existing = await prisma.princess.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const mergedPersonality = parsed.data.personality
    ? { ...((existing.personality as object) ?? {}), ...parsed.data.personality }
    : existing.personality;

  const updated = await prisma.princess.update({
    where: { id },
    data: {
      displayName: parsed.data.displayName ?? existing.displayName,
      personality: mergedPersonality as object
    }
  });
  return NextResponse.json({ ok: true, princess: shapeOne(updated, null) });
}

function shapeOne(
  p: { id: string; displayName: string; personality: unknown },
  fields: string[] | null
) {
  const personality = (p.personality ?? {}) as Record<string, unknown>;
  if (!fields) {
    return { id: p.id, displayName: p.displayName, ...personality };
  }
  const picked: Record<string, unknown> = { id: p.id, displayName: p.displayName };
  for (const f of fields) {
    if (f in personality) picked[f] = personality[f];
  }
  return picked;
}
