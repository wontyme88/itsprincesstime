"use client";

import { useState } from "react";

export default function EditorClient({
  id,
  initialDisplayName,
  initialPersonality
}: {
  id: string;
  initialDisplayName: string;
  initialPersonality: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [text, setText] = useState(initialPersonality);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    setStatus(null);
    let personality: unknown;
    try {
      personality = JSON.parse(text);
    } catch (e) {
      setErr("JSON 문법이 올바르지 않아요");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/princesses?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, personality })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(`저장 실패 (${json.error ?? res.status})`);
        return;
      }
      setStatus(`✓ 저장됨 (${new Date().toLocaleTimeString()})`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-4 p-5">
      <div>
        <label className="field-label">displayName</label>
        <input
          className="field-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">personality (JSON)</label>
        <textarea
          className="field-input font-mono text-xs leading-relaxed"
          style={{ minHeight: 420 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>
      {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</p>}
      {status && <p className="rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-700">{status}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={save} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
