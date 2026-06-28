import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/zod-schemas";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

/**
 * 회원가입: 인증 계정은 Supabase Auth(auth.users)에 생성하고,
 * 같은 UUID로 Prisma User/UserProfile 프로필 행을 만든다.
 * 비밀번호는 Supabase가 관리하므로 여기서 해싱/보관하지 않는다.
 */
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

  const ipCode = await generateUniqueIpCode();

  // 1) Supabase Auth 계정 생성 (이메일 인증 즉시 완료 처리)
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true
  });
  if (authError || !created?.user) {
    const msg = authError?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return NextResponse.json({ ok: false, error: "EmailExists" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "SignupFailed" }, { status: 500 });
  }

  // 2) 같은 UUID로 Prisma 프로필 행 생성. 실패 시 방금 만든 Auth 계정을 롤백.
  try {
    await prisma.user.create({
      data: {
        id: created.user.id,
        email,
        name: data.name,
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
  } catch (e) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id).catch(() => {});
    throw e;
  }

  return NextResponse.json({ ok: true, email, verified: true });
}
