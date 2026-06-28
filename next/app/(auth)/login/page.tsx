"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next") || "/app/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErr("이메일 또는 비밀번호가 올바르지 않아요");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-5 py-10">
      <h1 className="mb-1 text-2xl font-bold text-pink-700">로그인</h1>
      <p className="mb-6 text-xs text-pink-900/70">공주들이 기다리고 있어요 🌸</p>

      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <div>
          <label className="field-label">이메일</label>
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">비밀번호</label>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</div>
        )}
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </button>
        <div className="flex items-center justify-between text-xs text-pink-900/70">
          <Link href="/forgot-password" className="hover:underline">비밀번호 찾기</Link>
          <Link href="/signup" className="font-semibold text-pink-600 hover:underline">회원가입</Link>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
