import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { genUniqueInviteCode } from "@/lib/inviteCode";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: guard.status });

  const { id } = await params;
  const existing = await prisma.princess.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const inviteCode = await genUniqueInviteCode(6);
  await prisma.princess.update({ where: { id }, data: { inviteCode } });
  return NextResponse.json({ ok: true, inviteCode });
}
