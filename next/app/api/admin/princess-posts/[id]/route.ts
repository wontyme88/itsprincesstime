import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { princessPostUpdateSchema } from "@/lib/zod-schemas";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });
  }

  // 순서 스왑 단축 경로: PUT /api/admin/princess-posts/<id>?swapWith=<otherId>
  const url = new URL(req.url);
  const swapWith = url.searchParams.get("swapWith");
  if (swapWith) {
    const [a, b] = await Promise.all([
      prisma.princessPost.findUnique({ where: { id: params.id } }),
      prisma.princessPost.findUnique({ where: { id: swapWith } })
    ]);
    if (!a || !b) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });
    if (a.princessId !== b.princessId) {
      return NextResponse.json({ ok: false, error: "DifferentPrincess" }, { status: 400 });
    }
    // 두 position을 스왑 (동일 princessId 내 position은 not-unique이지만 충돌 회피 위해 temp값 거침)
    await prisma.$transaction([
      prisma.princessPost.update({ where: { id: a.id }, data: { position: -1 } }),
      prisma.princessPost.update({ where: { id: b.id }, data: { position: a.position } }),
      prisma.princessPost.update({ where: { id: a.id }, data: { position: b.position } })
    ]);
    return NextResponse.json({ ok: true, swapped: true });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 }); }
  const parsed = princessPostUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  const existing = await prisma.princessPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const updated = await prisma.princessPost.update({
    where: { id: params.id },
    data: {
      imageUrl: parsed.data.imageUrls !== undefined
        ? (parsed.data.imageUrls[0] ?? null)
        : (parsed.data.imageUrl === undefined ? existing.imageUrl : parsed.data.imageUrl),
      imageUrls: parsed.data.imageUrls !== undefined
        ? parsed.data.imageUrls
        : (parsed.data.imageUrl === undefined ? existing.imageUrls : (parsed.data.imageUrl ? [parsed.data.imageUrl] : [])),
      text: parsed.data.text ?? existing.text,
      emoji: parsed.data.emoji === undefined ? existing.emoji : parsed.data.emoji,
      comments: (parsed.data.comments ?? (existing.comments as object)) as object,
      position: parsed.data.position ?? existing.position
    }
  });
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });
  }
  const r = await prisma.princessPost.deleteMany({ where: { id: params.id } });
  return NextResponse.json({ ok: true, deleted: r.count });
}
