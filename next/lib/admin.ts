/**
 * 어드민 가드: 고정된 단일 관리자 이메일만 통과.
 */
import { auth } from "@/lib/auth";

const ADMIN_EMAIL = "wontyme88@naver.com";

export async function requireAdmin(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403 }
> {
  const session = await auth();
  const email = session?.user?.email;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!email || !userId) return { ok: false, status: 401 };

  if (email.toLowerCase() !== ADMIN_EMAIL) {
    return { ok: false, status: 403 };
  }

  return { ok: true, userId, email };
}
