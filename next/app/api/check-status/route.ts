import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// 로그인 실패 시 "이메일이 미인증인지" 여부를 노출 (열거 공격 완화 위해 rate limit)
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`status:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true, exists: false, verified: false });
  }

  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true, exists: false, verified: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { emailVerified: true }
  });

  // exists/verified 둘 다 false로 통일하려다, UX를 위해 노출 (rate limit으로 보호)
  return NextResponse.json({
    ok: true,
    exists: !!user,
    verified: !!user?.emailVerified
  });
}
