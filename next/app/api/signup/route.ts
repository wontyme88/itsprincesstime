import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/zod-schemas";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const IP_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeIpCode() {
  const block = () =>
    Array.from({ length: 4 }, () => IP_CODE_CHARS[Math.floor(Math.random() * IP_CODE_CHARS.length)]).join("");
  return `PRC-${block()}-${block()}`;
}
async function generateUniqueIpCode() {
  for (let i = 0; i < 5; i++) {
    const candidate = makeIpCode();
    const dup = await prisma.userProfile.findUnique({ where: { ipCode: candidate } });
    if (!dup) return candidate;
  }
  return makeIpCode();
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "EmailExists" }, { status: 409 });
  }

  // username: 이메일 prefix + 랜덤 4자리 (충돌 시 재시도)
  let username = data.name.toLowerCase().replace(/[^a-z0-9_]/g, "") || "princess";
  for (let i = 0; i < 5; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${username}_${suffix}`;
    const dup = await prisma.userProfile.findUnique({ where: { username: candidate } });
    if (!dup) {
      username = candidate;
      break;
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const ipCode = await generateUniqueIpCode();

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      passwordHash,
      emailVerified: new Date(),
      profile: {
        create: {
          username,
          princessName: data.princessName,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          birthTime: data.birthTime ?? null,
          mbti: data.mbti ?? null,
          ipCode,
          interests: data.interests,
          agreedTos: data.agreedTos,
          agreedPrivacy: data.agreedPrivacy
        }
      }
    }
  });

  return NextResponse.json({ ok: true, email, verified: true });
}
