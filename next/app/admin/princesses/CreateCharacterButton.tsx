"use client";

import { useState } from "react";

export default function CreateCharacterButton() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; inviteCode: string; displayName: string } | null>(null);

  const [form, setForm] = useState({
    id: "",
    displayName: "",
    avatarUrl: "",
    bio: "",
    themeColor: "#ec4899",
    mbti: "",
    vibe: "",
    emojis: "",
    tone: "",
    commentStyle: "",
    dmStyle: "",
    likeStyle: "",
    feedMood: "",
    initialPostsText: ""
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const initialPosts = form.initialPostsText
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((text) => ({ text }));

      const personality = {
        mbti: form.mbti || undefined,
        vibe: form.vibe || undefined,
        emojis: form.emojis ? form.emojis.split(/\s*,\s*/).filter(Boolean) : undefined,
        tone: form.tone || undefined,
        commentStyle: form.commentStyle || undefined,
        dmStyle: form.dmStyle || undefined,
        likeStyle: form.likeStyle || undefined,
        feedMood: form.feedMood || undefined
      };

      const res = await fetch("/api/admin/princesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: form.id.trim().toLowerCase(),
          displayName: form.displayName.trim(),
          avatarUrl: form.avatarUrl.trim() || undefined,
          bio: form.bio.trim() || undefined,
          themeColor: form.themeColor || undefined,
          personality,
          initialPosts
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `Error ${res.status}`);
        return;
      }
      setResult({ id: json.princess.id, inviteCode: json.inviteCode, displayName: json.princess.displayName });
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setOpen(false);
    if (result) {
      // 새로 만든 결과가 있으면 새로고침
      window.location.reload();
    }
    setResult(null);
    setError(null);
    setForm({
      id: "", displayName: "", avatarUrl: "", bio: "", themeColor: "#ec4899",
      mbti: "", vibe: "", emojis: "",
      tone: "", commentStyle: "", dmStyle: "", likeStyle: "", feedMood: "",
      initialPostsText: ""
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-700"
      >
        + 새 캐릭터
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-pink-700">새 캐릭터 만들기</h2>
          <button onClick={close} className="text-pink-700 hover:text-pink-900">✕</button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-pink-50 p-4 text-center">
              <div className="text-sm text-pink-900/70">새 공주 <b>{result.displayName}</b>가 생성됐어요 ✨</div>
              <div className="mt-3 text-xs text-pink-900/60">초대 코드</div>
              <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-pink-700">{result.inviteCode}</div>
              <button
                className="mt-3 rounded bg-pink-600 px-3 py-1.5 text-xs font-bold text-white"
                onClick={() => navigator.clipboard.writeText(result.inviteCode)}
              >
                코드 복사
              </button>
            </div>
            <button onClick={close} className="w-full rounded-lg bg-pink-600 px-4 py-2 font-bold text-white">완료</button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <Field label="아이디 (영문, 슬러그)">
              <input className="w-full rounded border px-2 py-1.5 font-mono"
                value={form.id} onChange={(e) => update("id", e.target.value)}
                placeholder="rose_diary" />
            </Field>
            <Field label="이름 (표시명)">
              <input className="w-full rounded border px-2 py-1.5"
                value={form.displayName} onChange={(e) => update("displayName", e.target.value)}
                placeholder="Rose" />
            </Field>
            <Field label="프로필 사진 URL">
              <input className="w-full rounded border px-2 py-1.5"
                value={form.avatarUrl} onChange={(e) => update("avatarUrl", e.target.value)}
                placeholder="https://..." />
            </Field>
            <Field label="소개글 (bio)">
              <textarea className="w-full rounded border px-2 py-1.5" rows={2}
                value={form.bio} onChange={(e) => update("bio", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="기본 프로필 컬러">
                <input type="color" className="h-9 w-full rounded border"
                  value={form.themeColor} onChange={(e) => update("themeColor", e.target.value)} />
              </Field>
              <Field label="이모지 (쉼표 구분)">
                <input className="w-full rounded border px-2 py-1.5"
                  value={form.emojis} onChange={(e) => update("emojis", e.target.value)}
                  placeholder="🌹,💖" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="MBTI"><input className="w-full rounded border px-2 py-1.5"
                value={form.mbti} onChange={(e) => update("mbti", e.target.value)} /></Field>
              <Field label="Vibe / 한 줄 분위기"><input className="w-full rounded border px-2 py-1.5"
                value={form.vibe} onChange={(e) => update("vibe", e.target.value)} /></Field>
            </div>
            <Field label="성격 / 말투"><textarea className="w-full rounded border px-2 py-1.5" rows={2}
              value={form.tone} onChange={(e) => update("tone", e.target.value)} /></Field>
            <Field label="댓글 스타일"><textarea className="w-full rounded border px-2 py-1.5" rows={2}
              value={form.commentStyle} onChange={(e) => update("commentStyle", e.target.value)} /></Field>
            <Field label="DM 스타일"><textarea className="w-full rounded border px-2 py-1.5" rows={2}
              value={form.dmStyle} onChange={(e) => update("dmStyle", e.target.value)} /></Field>
            <Field label="좋아요 반응 스타일"><textarea className="w-full rounded border px-2 py-1.5" rows={2}
              value={form.likeStyle} onChange={(e) => update("likeStyle", e.target.value)} /></Field>
            <Field label="피드 분위기"><textarea className="w-full rounded border px-2 py-1.5" rows={2}
              value={form.feedMood} onChange={(e) => update("feedMood", e.target.value)} /></Field>
            <Field label="초기 게시글 (한 줄에 하나씩)">
              <textarea className="w-full rounded border px-2 py-1.5 text-xs" rows={4}
                value={form.initialPostsText} onChange={(e) => update("initialPostsText", e.target.value)}
                placeholder={"오늘 처음 인사해요 🌸\n날씨가 너무 좋아서 산책했어요"} />
            </Field>

            {error && <div className="rounded bg-rose-50 p-2 text-xs text-rose-700">에러: {error}</div>}

            <div className="flex gap-2 pt-2">
              <button onClick={close} className="flex-1 rounded border px-3 py-2 text-sm">취소</button>
              <button onClick={submit} disabled={saving || !form.id || !form.displayName}
                className="flex-1 rounded bg-pink-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                {saving ? "생성 중…" : "만들기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-pink-900/80">{label}</span>
      {children}
    </label>
  );
}
