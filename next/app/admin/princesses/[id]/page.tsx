import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import EditorClient from "./editor";
import ProfileEditor from "./ProfileEditor";
import PostsEditor from "./PostsEditor";

export default async function AdminPrincessEditPage({
  params
}: {
  params: { id: string };
}) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    if (guard.status === 401) redirect(`/login?next=/admin/princesses/${params.id}`);
    return (
      <main className="px-5 py-10">
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">관리자 권한이 없어요.</div>
      </main>
    );
  }

  const princess = await prisma.princess.findUnique({ where: { id: params.id } });
  if (!princess) notFound();

  const [posts, allPrincesses] = await Promise.all([
    prisma.princessPost.findMany({
      where: { princessId: princess.id },
      orderBy: { position: "asc" }
    }),
    prisma.princess.findMany({
      orderBy: { id: "asc" },
      select: { id: true, displayName: true }
    })
  ]);

  return (
    <main className="space-y-6 px-5 py-8">
      <div className="flex items-center gap-2 text-xs text-pink-700">
        <Link href="/admin/princesses" className="hover:underline">← 목록</Link>
        <span className="text-pink-300">·</span>
        <Link href="/app/" className="hover:underline">사이트 보기 →</Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold text-pink-700">
          {princess.displayName} <span className="text-sm text-pink-700/60">@{princess.id}</span>
        </h1>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-bold text-pink-900">프로필</h2>
        <ProfileEditor
          id={princess.id}
          initialDisplayName={princess.displayName}
          initialAvatarUrl={princess.avatarUrl}
          initialBio={princess.bio}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-pink-900">게시글</h2>
        <PostsEditor
          princessId={princess.id}
          allPrincesses={allPrincesses}
          initialPosts={posts.map((p) => ({
            id: p.id,
            imageUrl: p.imageUrl,
            imageUrls: p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
            emoji: p.emoji,
            text: p.text,
            comments: Array.isArray(p.comments) ? (p.comments as { id: string; text: string }[]) : [],
            position: p.position,
            createdAt: p.createdAt.toISOString()
          }))}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-pink-900">Personality (JSON)</h2>
        <p className="mb-3 text-xs text-pink-900/60">JSON으로 personality 필드를 직접 편집해요. 저장 시 부분 머지로 반영됩니다.</p>
        <EditorClient
          id={princess.id}
          initialDisplayName={princess.displayName}
          initialPersonality={JSON.stringify(princess.personality ?? {}, null, 2)}
        />
      </section>
    </main>
  );
}
