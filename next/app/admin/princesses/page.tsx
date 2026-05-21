import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminPrincessesPage() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    if (guard.status === 401) redirect("/login?next=/admin/princesses");
    return (
      <main className="px-5 py-10">
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          관리자 권한이 없어요. <Link href="/" className="underline">홈으로</Link>
        </div>
      </main>
    );
  }

  const list = await prisma.princess.findMany({ orderBy: { id: "asc" } });

  return (
    <main className="px-5 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pink-700">공주 관리</h1>
        <Link href="/app" className="text-xs text-pink-600 hover:underline">/app으로 →</Link>
      </div>
      <div className="space-y-2">
        {list.map((p) => {
          const meta = (p.personality ?? {}) as { mbti?: string; vibe?: string; emojis?: string[] };
          return (
            <Link
              key={p.id}
              href={`/admin/princesses/${p.id}`}
              className="card flex items-center justify-between p-4 hover:bg-pink-50/50 transition-colors"
            >
              <div>
                <div className="text-sm font-bold text-pink-900">{p.displayName} <span className="ml-1 text-xs text-pink-700/60">@{p.id}</span></div>
                <div className="text-xs text-pink-900/60">{meta.mbti} · {meta.vibe}</div>
              </div>
              <div className="text-xl">{meta.emojis?.[0] ?? "👑"}</div>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-pink-900/50">
        로그인 계정: <b>{guard.email}</b>
      </p>
    </main>
  );
}
