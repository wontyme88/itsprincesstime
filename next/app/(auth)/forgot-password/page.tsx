"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-5 py-10">
      <h1 className="mb-1 text-2xl font-bold text-pink-700">비밀번호 찾기</h1>
      <p className="mb-6 text-xs text-pink-900/70">가입한 이메일로 재설정 링크를 보내드려요</p>

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
        {sent && (
          <p className="rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-700">
            메일을 확인해주세요. (가입된 이메일이라면 도착해요)
          </p>
        )}
        <button className="btn-primary w-full" disabled={submitting || sent}>
          {submitting ? "전송 중..." : sent ? "전송 완료" : "재설정 메일 보내기"}
        </button>
        <p className="text-center text-xs text-pink-900/70">
          <Link href="/login" className="hover:underline">로그인으로 돌아가기</Link>
        </p>
      </form>
    </main>
  );
}
