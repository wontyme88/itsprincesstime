"use client";

import { useState } from "react";

type Item = {
  id: string;
  princessId: string | null;
  kind: string;
  text: string;
  createdAt: string;
};

const KIND_LABEL: Record<string, string> = {
  diary: "📔 일기",
  dm_user: "💌 내가 보낸 DM",
  dm_princess: "💌 공주가 보낸 DM",
  persona_summary: "👤 성향 요약",
  comment: "💬 댓글"
};

export default function MemoryListClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("이 메모리를 삭제할까요?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/memory?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setItems((s) => s.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  };

  if (!items.length) {
    return (
      <div className="card p-6 text-center text-sm text-pink-900/60">
        아직 저장된 메모리가 없어요. 일기를 쓰거나 DM을 보내면 자동으로 쌓여요 🌸
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((m) => (
        <div key={m.id} className="card p-3.5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-pink-900/60">
            <div className="flex items-center gap-1.5">
              <span>{KIND_LABEL[m.kind] || m.kind}</span>
              {m.princessId && (
                <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-pink-700">
                  @{m.princessId.replace(/_$/, "").replace("_princess", "").replace("_diary", "")}
                </span>
              )}
            </div>
            <span>{new Date(m.createdAt).toLocaleString("ko-KR")}</span>
          </div>
          <div className="text-sm text-pink-900 whitespace-pre-wrap break-words">{m.text}</div>
          <div className="mt-2 text-right">
            <button
              onClick={() => remove(m.id)}
              disabled={busy === m.id}
              className="text-[11px] text-rose-500 hover:underline disabled:opacity-50"
            >
              {busy === m.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
