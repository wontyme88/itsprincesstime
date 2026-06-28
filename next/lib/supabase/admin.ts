import { createClient } from "@supabase/supabase-js";

/**
 * service-role 키로 만든 관리자 클라이언트.
 * RLS를 우회하므로 **서버 전용** (Storage 업로드 등)으로만 사용. 브라우저에 노출 금지.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
}
