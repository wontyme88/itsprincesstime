import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/zod-schemas";
import { generateResetToken } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`forgot:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // 항상 ok
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { token, hash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 30 * 60_000)
      }
    });
    const base = process.env.APP_BASE_URL || "http://localhost:3000";
    const link = `${base}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(email, link);
    } catch (e) {
      console.warn("[forgot] email send failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}
