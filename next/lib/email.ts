import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL || "Princessgram <onboarding@resend.dev>";

function devLog(label: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email/dev] ${label}`, payload);
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  devLog("verification", { to, code });
  if (!resend) return; // 키 없으면 콘솔 로그만
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Princessgram 이메일 인증 코드",
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; padding: 24px;">
        <h2 style="color:#ec4899">Princessgram 이메일 인증</h2>
        <p>아래 코드를 15분 안에 입력해주세요.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; background:#fbcfe8; padding:14px 20px; border-radius:10px; display:inline-block;">${code}</p>
        <p style="color:#666; font-size: 12px; margin-top: 18px;">본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  devLog("password reset", { to, link });
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Princessgram 비밀번호 재설정",
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; padding: 24px;">
        <h2 style="color:#ec4899">비밀번호 재설정</h2>
        <p>아래 링크를 눌러 30분 안에 새 비밀번호를 설정해주세요.</p>
        <p><a href="${link}" style="background:#ec4899;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block;">비밀번호 재설정</a></p>
        <p style="color:#666; font-size: 12px;">본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
      </div>
    `
  });
}
