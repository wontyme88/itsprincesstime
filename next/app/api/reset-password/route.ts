import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/zod-schemas";
import { hashResetToken } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`reset:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.consumed || record.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "InvalidToken" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { consumed: true }
    })
  ]);

  return NextResponse.json({ ok: true });
}
