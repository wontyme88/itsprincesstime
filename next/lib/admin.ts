/**
 * 어드민 가드: 고정된 단일 관리자 이메일만 통과.
 */
import { getSessionUser } from "@/lib/auth-user";

const ADMIN_EMAIL = "wontyme88@naver.com";

export async function requireAdmin(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403 }
> {
  const authUser = await getSessionUser();
  const email = authUser?.email;
  const userId = authUser?.id;
  if (!email || !userId) return { ok: false, status: 401 };

  if (email.toLowerCase() !== ADMIN_EMAIL) {
    return { ok: false, status: 403 };
  }

  return { ok: true, userId, email };
}
