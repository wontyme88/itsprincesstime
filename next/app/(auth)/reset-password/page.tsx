"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 비밀번호 재설정 페이지.
 * 사용자는 재설정 메일 → /auth/callback(코드를 세션으로 교환) → 이 페이지로 도착하며,
 * 이미 복구 세션이 존재하는 상태다. 여기서는 새 비밀번호로 updateUser만 하면 된다.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw !== pw2) { setErr("비밀번호가 일치하지 않아요"); return; }
    if (pw.length < 8) { setErr("8자 이상이어야 해요"); return; }
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setErr("링크가 만료되었어요. 다시 요청해주세요.");
        return;
      }
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  };

  if (ready && !hasSession) {
    return (
      <main className="px-5 py-10">
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          잘못된 접근이거나 링크가 만료되었어요.
        </p>
        <Link href="/forgot-password" className="mt-4 inline-block text-xs text-pink-600 hover:underline">
          비밀번호 찾기 다시 시도
        </Link>
      </main>
    );
  }

  return (
    <main className="px-5 py-10">
      <h1 className="mb-1 text-2xl font-bold text-pink-700">새 비밀번호</h1>
      <p className="mb-6 text-xs text-pink-900/70">새로 사용할 비밀번호를 입력해주세요</p>
      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <div>
          <label className="field-label">새 비밀번호</label>
          <input className="field-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label className="field-label">새 비밀번호 확인</label>
          <input className="field-input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</p>}
        <button className="btn-primary w-full" disabled={submitting || !hasSession}>
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}
