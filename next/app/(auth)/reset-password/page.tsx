"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw !== pw2) { setErr("비밀번호가 일치하지 않아요"); return; }
    if (pw.length < 8) { setErr("8자 이상이어야 해요"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr("링크가 만료되었거나 사용된 토큰이에요. 다시 요청해주세요.");
        return;
      }
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="px-5 py-10">
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          잘못된 접근이에요.
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
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
