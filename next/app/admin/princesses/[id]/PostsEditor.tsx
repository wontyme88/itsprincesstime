"use client";

import { useState } from "react";
import { uploadMedia, isVideoUrl } from "./upload-helper";

function MediaThumb({ url, className }: { url: string; className?: string }) {
  if (isVideoUrl(url)) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <video src={url} muted playsInline className="h-full w-full rounded-lg object-cover" />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl text-white drop-shadow">▶</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`rounded-lg object-cover ${className ?? ""}`} />;
}

type Comment = { id: string; text: string };

type Post = {
  id: string;
  imageUrl: string | null;
  imageUrls: string[];
  emoji: string | null;
  text: string;
  comments: Comment[];
  position: number;
  createdAt: string;
};

type PrincessOption = { id: string; displayName: string };

export default function PostsEditor({
  princessId,
  allPrincesses,
  initialPosts
}: {
  princessId: string;
  allPrincesses: PrincessOption[];
  initialPosts: Post[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  // 새 게시글 작성 상태
  const [newText, setNewText] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [newComments, setNewComments] = useState<Comment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const otherPrincesses = allPrincesses.filter((p) => p.id !== princessId);

  const onPickImages = async (files: FileList) => {
    setErr(null);
    setUploading(true);
    try {
      const remaining = Math.max(0, 10 - newImageUrls.length);
      const list = Array.from(files).slice(0, remaining);
      const uploaded: string[] = [];
      for (const f of list) {
        uploaded.push(await uploadMedia(f));
      }
      setNewImageUrls((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const moveNewImage = (from: number, to: number) => {
    setNewImageUrls((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  };

  const createPost = async () => {
    if (!newText.trim()) {
      setErr("본문을 입력해주세요");
      return;
    }
    const totalSize = newImageUrls.reduce((s, u) => s + u.length, 0);
    if (totalSize > 25_000_000) {
      setErr(`미디어 합계 용량이 너무 커요 (${(totalSize/1_000_000).toFixed(1)}MB). 영상을 줄이거나 일부를 제거해주세요.`);
      return;
    }
    setErr(null);
    setCreating(true);
    let res: Response;
    try {
      res = await fetch(`/api/admin/princess-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          princessId,
          text: newText.trim(),
          emoji: newEmoji || null,
          imageUrls: newImageUrls,
          comments: newComments.filter((c) => c.id && c.text.trim()).map((c) => ({ id: c.id, text: c.text.trim() }))
        })
      });
      const raw = await res.text();
      let json: { ok?: boolean; error?: string; post?: { id: string; imageUrl: string | null; imageUrls?: string[]; emoji: string | null; text: string; comments?: unknown; position: number; createdAt: string | Date } } = {};
      try { json = raw ? JSON.parse(raw) : {}; } catch { /* keep as empty */ }
      if (!res.ok || !json.ok) {
        const hint = res.status === 413 || res.status === 0 ? " (요청이 너무 커요 — 이미지/영상 용량을 줄여보세요)" : "";
        setErr(`작성 실패 (${json.error ?? res.status})${hint}`);
        return;
      }
      if (!json.post) { setErr("응답이 비어있어요"); return; }
      const p = json.post;
      setPosts((prev) => [...prev, {
        id: p.id,
        imageUrl: p.imageUrl,
        imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
        emoji: p.emoji,
        text: p.text,
        comments: Array.isArray(p.comments) ? (p.comments as Comment[]) : [],
        position: p.position,
        createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString()
      }].sort((a, b) => a.position - b.position));
      setNewText(""); setNewEmoji(""); setNewImageUrls([]); setNewComments([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setCreating(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("정말 삭제할까요?")) return;
    const res = await fetch(`/api/admin/princess-posts/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok && json.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(`삭제 실패 (${json.error ?? res.status})`);
    }
  };

  const updatePost = async (id: string, patch: { text?: string; emoji?: string | null; imageUrls?: string[]; comments?: Comment[] }) => {
    const res = await fetch(`/api/admin/princess-posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      setPosts((prev) => prev.map((p) => (p.id === id ? {
        ...p,
        ...json.post,
        imageUrls: Array.isArray(json.post.imageUrls) ? json.post.imageUrls : (json.post.imageUrl ? [json.post.imageUrl] : []),
        comments: Array.isArray(json.post.comments) ? json.post.comments : [],
        createdAt: typeof json.post.createdAt === "string" ? json.post.createdAt : new Date(json.post.createdAt).toISOString()
      } : p)));
    } else {
      alert(`수정 실패 (${json.error ?? res.status})`);
    }
  };

  const swapPosition = async (id: string, otherId: string) => {
    const res = await fetch(`/api/admin/princess-posts/${id}?swapWith=${encodeURIComponent(otherId)}`, { method: "PUT" });
    const json = await res.json();
    if (res.ok && json.ok) {
      setPosts((prev) => {
        const a = prev.find((p) => p.id === id);
        const b = prev.find((p) => p.id === otherId);
        if (!a || !b) return prev;
        return prev
          .map((p) => p.id === id ? { ...p, position: b.position } : p.id === otherId ? { ...p, position: a.position } : p)
          .sort((x, y) => x.position - y.position);
      });
    } else {
      alert(`순서 변경 실패 (${json.error ?? res.status})`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="text-xs font-semibold text-pink-900/80">새 게시글 작성</div>
        {newImageUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {newImageUrls.map((url, i) => (
              <div key={i} className="relative">
                <MediaThumb url={url} className="aspect-square w-full" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/40 px-1 text-[10px] text-white">
                  <span>{i + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" className="disabled:opacity-30" disabled={i === 0} onClick={() => moveNewImage(i, i - 1)}>←</button>
                    <button type="button" className="disabled:opacity-30" disabled={i === newImageUrls.length - 1} onClick={() => moveNewImage(i, i + 1)}>→</button>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute right-1 bottom-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                  onClick={() => setNewImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                >제거</button>
              </div>
            ))}
          </div>
        )}
        {newImageUrls.length < 10 && (
          <label className="btn-ghost cursor-pointer w-full">
            {uploading ? "업로드 중..." : `이미지 추가 (${newImageUrls.length}/10)`}
            <input type="file" accept="image/*,video/*" multiple className="hidden" disabled={uploading}
              onChange={(e) => { const fs = e.target.files; if (fs && fs.length) onPickImages(fs); e.target.value = ""; }} />
          </label>
        )}
        <div className="flex gap-2">
          <input
            className="field-input w-20 text-center"
            placeholder="🍑"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            maxLength={4}
          />
          <textarea
            className="field-input flex-1"
            rows={3}
            placeholder="본문(캡션)..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
        </div>

        <CommentsEditor
          comments={newComments}
          onChange={setNewComments}
          otherPrincesses={otherPrincesses}
        />

        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</p>}
        <button className="btn-primary w-full" onClick={createPost} disabled={creating || uploading}>
          {creating ? "작성 중..." : "게시"}
        </button>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-center text-xs text-pink-900/50">아직 게시글이 없어요</p>
        )}
        {posts.map((p, idx) => (
          <PostItem
            key={p.id}
            post={p}
            otherPrincesses={otherPrincesses}
            canMoveUp={idx > 0}
            canMoveDown={idx < posts.length - 1}
            onMoveUp={() => swapPosition(p.id, posts[idx - 1]!.id)}
            onMoveDown={() => swapPosition(p.id, posts[idx + 1]!.id)}
            onDelete={() => deletePost(p.id)}
            onUpdate={(patch) => updatePost(p.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function CommentsEditor({
  comments,
  onChange,
  otherPrincesses
}: {
  comments: Comment[];
  onChange: (next: Comment[]) => void;
  otherPrincesses: PrincessOption[];
}) {
  const add = () => {
    const defaultId = otherPrincesses[0]?.id ?? "";
    onChange([...comments, { id: defaultId, text: "" }]);
  };
  const update = (i: number, patch: Partial<Comment>) => {
    onChange(comments.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  };
  const remove = (i: number) => onChange(comments.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg border border-pink-100 bg-pink-50/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-pink-900/80">공주들의 댓글 ({comments.length})</span>
        <button type="button" className="text-xs text-pink-700 hover:underline" onClick={add}>+ 댓글 추가</button>
      </div>
      {comments.length === 0 ? (
        <p className="text-xs text-pink-900/50">댓글이 없어요</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2">
              <select
                className="field-input w-32 shrink-0 text-xs"
                value={c.id}
                onChange={(e) => update(i, { id: e.target.value })}
              >
                {otherPrincesses.map((p) => (
                  <option key={p.id} value={p.id}>{p.displayName}</option>
                ))}
              </select>
              <input
                className="field-input flex-1 text-xs"
                value={c.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="댓글 내용..."
              />
              <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => remove(i)}>삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostItem({
  post,
  otherPrincesses,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate
}: {
  post: Post;
  otherPrincesses: PrincessOption[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdate: (patch: { text?: string; emoji?: string | null; imageUrls?: string[]; comments?: Comment[] }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.text);
  const [emoji, setEmoji] = useState(post.emoji ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(post.imageUrls);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onPick = async (files: FileList) => {
    setUploading(true);
    try {
      const remaining = Math.max(0, 10 - imageUrls.length);
      const list = Array.from(files).slice(0, remaining);
      const uploaded: string[] = [];
      for (const f of list) uploaded.push(await uploadMedia(f));
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (e) {
      alert(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (from: number, to: number) => {
    setImageUrls((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate({
        text,
        emoji: emoji || null,
        imageUrls,
        comments: comments.filter((c) => c.id && c.text.trim()).map((c) => ({ id: c.id, text: c.text.trim() }))
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card overflow-hidden p-3">
      {!editing ? (
        <div className="flex gap-3">
          {post.imageUrls.length > 0 && (
            <div className="relative h-20 w-20 shrink-0">
              <MediaThumb url={post.imageUrls[0]} className="h-20 w-20" />
              {post.imageUrls.length > 1 && (
                <span className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">+{post.imageUrls.length - 1}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-pink-900 whitespace-pre-wrap break-words">
              {post.emoji && <span className="mr-1">{post.emoji}</span>}
              {post.text}
            </p>
            {post.comments.length > 0 && (
              <p className="mt-1 text-[11px] text-pink-700/70">💬 {post.comments.length}개의 공주 댓글</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-pink-700">
              <span className="text-pink-900/40">#{post.position}</span>
              <button className="hover:underline disabled:opacity-30" onClick={onMoveUp} disabled={!canMoveUp}>↑</button>
              <button className="hover:underline disabled:opacity-30" onClick={onMoveDown} disabled={!canMoveDown}>↓</button>
              <button className="hover:underline" onClick={() => { setEditing(true); setText(post.text); setEmoji(post.emoji ?? ""); setImageUrls(post.imageUrls); setComments(post.comments); }}>수정</button>
              <button className="text-rose-600 hover:underline" onClick={onDelete}>삭제</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative">
                  <MediaThumb url={url} className="aspect-square w-full" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/40 px-1 text-[10px] text-white">
                    <span>{i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" className="disabled:opacity-30" disabled={i === 0} onClick={() => moveImage(i, i - 1)}>←</button>
                      <button type="button" className="disabled:opacity-30" disabled={i === imageUrls.length - 1} onClick={() => moveImage(i, i + 1)}>→</button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute right-1 bottom-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                    onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  >제거</button>
                </div>
              ))}
            </div>
          )}
          {imageUrls.length < 10 && (
            <label className="btn-ghost cursor-pointer w-full">
              {uploading ? "업로드 중..." : `이미지 추가 (${imageUrls.length}/10)`}
              <input type="file" accept="image/*,video/*" multiple className="hidden" disabled={uploading}
                onChange={(e) => { const fs = e.target.files; if (fs && fs.length) onPick(fs); e.target.value = ""; }} />
            </label>
          )}
          <div className="flex gap-2">
            <input className="field-input w-20 text-center" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} placeholder="🍑" />
            <textarea className="field-input flex-1" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <CommentsEditor comments={comments} onChange={setComments} otherPrincesses={otherPrincesses} />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={save} disabled={saving || uploading}>{saving ? "저장 중..." : "저장"}</button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
