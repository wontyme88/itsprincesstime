import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 현재 로그인한 사용자를 반환. 미로그인 시 null.
 *
 * 기존 NextAuth 패턴
 *   const session = await auth();
 *   const userId = (session?.user as { id?: string })?.id;
 * 를 한 줄로 대체한다. id는 Supabase auth user의 UUID이며,
 * Prisma User.id 와 동일 값으로 사용한다.
 */
export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}
