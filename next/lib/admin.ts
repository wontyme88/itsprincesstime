/**
 * 어드민 가드: 환경변수 ADMIN_EMAILS (쉼표 구분) 에 포함된 사용자만 통과.
 * 예: ADMIN_EMAILS="dongsoonh@lannerinc.co.kr,admin@example.com"
 */
import { auth } from "@/lib/auth";

export async function requireAdmin(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403 }
> {
  const session = await auth();
  const email = session?.user?.email;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!email || !userId) return { ok: false, status: 401 };

  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length && !allowed.includes(email.toLowerCase())) {
    return { ok: false, status: 403 };
  }
  // ADMIN_EMAILS 미설정 시 모두 거부 (안전 기본값)
  if (!allowed.length) return { ok: false, status: 403 };

  return { ok: true, userId, email };
}
