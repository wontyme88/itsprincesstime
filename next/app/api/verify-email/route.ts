import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/zod-schemas";
import { verifyOtp } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`verify:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }

  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const otp = await prisma.otpCode.findFirst({
    where: { email, purpose: "email_verify", consumedAt: null },
    orderBy: { createdAt: "desc" }
  });
  if (!otp) {
    return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });
  }
  if (otp.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Expired" }, { status: 410 });
  }
  if (otp.attempts >= 5) {
    return NextResponse.json({ ok: false, error: "TooManyAttempts" }, { status: 429 });
  }

  const matched = await verifyOtp(parsed.data.code, otp.codeHash);
  if (!matched) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } }
    });
    return NextResponse.json({ ok: false, error: "WrongCode" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    })
  ]);

  return NextResponse.json({ ok: true });
}
