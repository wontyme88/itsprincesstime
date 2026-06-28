import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 로그아웃: Supabase 세션 쿠키를 만료시킨다.
 * 레거시 프런트(index.html)의 logoutUser()가 호출한다.
 */
export async function POST() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
