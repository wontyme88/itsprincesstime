"use client";

import { useState } from "react";

export default function InviteCodeCell({ id, initialCode, isDefault }: { id: string; initialCode: string | null; isDefault: boolean }) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isDefault && !code) {
    return <span className="text-[10px] text-pink-700/50">기본 공주</span>;
  }

  async function regen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("초대 코드를 재발급하면 이전 코드는 사용할 수 없게 돼요. 진행할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/princesses/${id}/regenerate-code`, {
        method: "POST",
        credentials: "same-origin"
      });
      const json = await res.json();
      if (json.ok) setCode(json.inviteCode);
    } finally {
      setBusy(false);
    }
  }

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex items-center gap-1.5">
      <code className="rounded bg-pink-50 px-1.5 py-0.5 font-mono text-[11px] tracking-widest text-pink-700">
        {code ?? "—"}
      </code>
      {code && (
        <>
          <button onClick={copy} className="text-[10px] text-pink-700 hover:underline">
            {copied ? "복사됨!" : "복사"}
          </button>
          <button onClick={regen} disabled={busy} className="text-[10px] text-pink-700/60 hover:underline disabled:opacity-40">
            재발급
          </button>
        </>
      )}
      {!code && !isDefault && (
        <button onClick={regen} disabled={busy} className="text-[10px] text-pink-700 hover:underline">
          코드 발급
        </button>
      )}
    </div>
  );
}
