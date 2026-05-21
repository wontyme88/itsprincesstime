"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") || "";
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (json.error === "Expired") setErr("코드가 만료됐어요. 재전송해주세요.");
        else if (json.error === "TooManyAttempts") setErr("시도 횟수를 초과했어요. 재전송 후 다시 시도해주세요.");
        else if (json.error === "WrongCode") setErr("코드가 일치하지 않아요");
        else setErr("인증에 실패했어요");
        return;
      }
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setErr(null);
    setInfo(null);
    setCooldown(60);
    const tick = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(tick); return 0; }
        return c - 1;
      });
    }, 1000);
    try {
      await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setInfo("인증 코드를 다시 보냈어요");
    } catch {
      setErr("재전송 실패");
    }
  };

  return (
    <main className="px-5 py-10">
      <h1 className="mb-1 text-2xl font-bold text-pink-700">이메일 인증</h1>
      <p className="mb-6 text-xs text-pink-900/70">{email}로 보낸 6자리 코드를 입력해주세요</p>

      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <div>
          <label className="field-label">인증 코드</label>
          <input
            className="field-input tracking-[8px] text-center text-lg"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
          />
        </div>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</p>}
        {info && <p className="rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-700">{info}</p>}

        <button className="btn-primary w-full" disabled={submitting || code.length !== 6}>
          {submitting ? "확인 중..." : "인증"}
        </button>
        <button type="button" onClick={resend} disabled={cooldown > 0} className="btn-ghost w-full">
          {cooldown > 0 ? `재전송 (${cooldown}s)` : "코드 재전송"}
        </button>

        <p className="text-center text-xs text-pink-900/70">
          <Link href="/login" className="hover:underline">로그인으로 돌아가기</Link>
        </p>
      </form>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
