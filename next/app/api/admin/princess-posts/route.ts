import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { princessPostCreateSchema } from "@/lib/zod-schemas";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 }); }
  const parsed = princessPostCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  const princess = await prisma.princess.findUnique({ where: { id: parsed.data.princessId } });
  if (!princess) return NextResponse.json({ ok: false, error: "PrincessNotFound" }, { status: 404 });

  // position 미지정이면 해당 공주의 max(position)+1
  let position = parsed.data.position;
  if (position === undefined) {
    const max = await prisma.princessPost.findFirst({
      where: { princessId: parsed.data.princessId },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    position = (max?.position ?? -1) + 1;
  }

  const post = await prisma.princessPost.create({
    data: {
      princessId: parsed.data.princessId,
      imageUrl: parsed.data.imageUrl ?? (parsed.data.imageUrls?.[0] ?? null),
      imageUrls: parsed.data.imageUrls ?? (parsed.data.imageUrl ? [parsed.data.imageUrl] : []),
      emoji: parsed.data.emoji ?? null,
      text: parsed.data.text,
      comments: (parsed.data.comments ?? []) as object,
      position
    }
  });
  return NextResponse.json({ ok: true, post });
}
