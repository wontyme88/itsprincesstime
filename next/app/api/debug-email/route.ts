import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * 디버그 전용: Resend 키 / FROM 주소가 잘 동작하는지 확인.
 * 사용: GET /api/debug-email?to=YOUR_EMAIL  (관리자 외에는 호출 금지)
 * 끝나면 이 라우트는 삭제하세요.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  if (!to) {
    return NextResponse.json({ ok: false, error: "missing ?to=email" });
  }

  const key = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.RESEND_FROM_EMAIL || "";

  const diag: Record<string, unknown> = {
    keyPresent: !!key,
    keyLength: key.length,
    keyPrefix: key.slice(0, 3),
    from,
    adminEmails: process.env.ADMIN_EMAILS
  };

  if (!key) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY missing", diag });
  }

  try {
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from: from || "Princessgram <onboarding@resend.dev>",
      to,
      subject: "[디버그] Princessgram",
      html: "<p>Resend 직접 테스트</p>"
    });
    return NextResponse.json({ ok: true, diag, result });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      diag,
      errorMessage: (e as Error).message,
      errorName: (e as Error).name,
      error: JSON.parse(JSON.stringify(e))
    });
  }
}
