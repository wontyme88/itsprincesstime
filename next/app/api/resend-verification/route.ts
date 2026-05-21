import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/zod-schemas";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`resend:${ip}`, 3, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }

  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // 응답은 항상 ok (열거 방지)
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      email,
      purpose: "email_verify",
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60_000)
    }
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (e) {
    console.warn("[resend] email send failed", e);
  }

  return NextResponse.json({ ok: true });
}
