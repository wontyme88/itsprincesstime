import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import CreateCharacterButton from "./CreateCharacterButton";
import InviteCodeCell from "./InviteCodeCell";

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

  const list = await prisma.princess.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });

  return (
    <main className="px-5 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pink-700">공주 관리</h1>
        <div className="flex items-center gap-3">
          <CreateCharacterButton />
          <Link href="/app/" className="text-xs text-pink-600 hover:underline">메인으로 →</Link>
        </div>
      </div>
      <div className="space-y-2">
        {list.map((p) => {
          const meta = (p.personality ?? {}) as { mbti?: string; vibe?: string; emojis?: string[] };
          return (
            <div key={p.id} className="card flex items-center justify-between gap-3 p-4 hover:bg-pink-50/50 transition-colors">
              <Link href={`/admin/princesses/${p.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-pink-900">
                  {p.displayName} <span className="ml-1 text-xs text-pink-700/60">@{p.id}</span>
                </div>
                <div className="truncate text-xs text-pink-900/60">{meta.mbti} · {meta.vibe}</div>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <InviteCodeCell id={p.id} initialCode={p.inviteCode} isDefault={p.isDefault} />
                <div className="text-xl">{meta.emojis?.[0] ?? "👑"}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-pink-900/50">
        로그인 계정: <b>{guard.email}</b>
      </p>
    </main>
  );
}
