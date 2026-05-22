"use client";

import { useState } from "react";
import { uploadImage } from "./upload-helper";

export default function ProfileEditor({
  id,
  initialDisplayName,
  initialAvatarUrl,
  initialBio
}: {
  id: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onPickAvatar = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setAvatarUrl(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setErr(null);
    setStatus(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/princesses?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarUrl, bio: bio || null })
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
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-1 ring-pink-200" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-2xl font-bold text-white">
            {displayName.charAt(0)}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="btn-ghost cursor-pointer">
            {uploading ? "업로드 중..." : "아바타 선택"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickAvatar(f);
                e.target.value = "";
              }}
            />
          </label>
          {avatarUrl && (
            <button type="button" className="text-xs text-pink-700/70 hover:underline" onClick={() => setAvatarUrl(null)}>
              아바타 제거
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="field-label">displayName</label>
        <input className="field-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div>
        <label className="field-label">소개글 (bio)</label>
        <textarea
          className="field-input"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="공주의 자기소개"
        />
      </div>

      {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</p>}
      {status && <p className="rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-700">{status}</p>}

      <button className="btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? "저장 중..." : "프로필 저장"}
      </button>
    </div>
  );
}
