import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MyFeedPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login?next=/me/feed");

  const [posts, threads] = await Promise.all([
    prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        comments: { orderBy: { createdAt: "asc" } }
      }
    }),
    prisma.directMessageThread.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } }
    })
  ]);

  return (
    <main className="px-5 py-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-pink-700">
        <Link href="/feed" className="hover:underline">← 피드로</Link>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-pink-700">내 데이터</h1>
      <p className="mb-5 text-xs text-pink-900/60">
        서버에 저장된 게시글과 DM이에요. 다른 기기로 로그인해도 여기서 볼 수 있어요 🌸
      </p>

      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-pink-900">📔 일기 ({posts.length})</h2>
        {posts.length === 0 ? (
          <div className="card p-5 text-center text-xs text-pink-900/50">아직 일기가 없어요</div>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="mb-1 text-[11px] text-pink-900/50">
                  {new Date(p.createdAt).toLocaleString("ko-KR")}
                </div>
                <div className="text-sm whitespace-pre-wrap text-pink-900">{p.text}</div>
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="" className="mt-2 max-h-64 rounded-lg" />
                )}
                {p.comments.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-pink-100 pt-2">
                    {p.comments.map((c) => (
                      <div key={c.id} className="text-[12px]">
                        <span className="font-semibold text-pink-700">
                          {c.princessId ? c.princessId : "나"}
                        </span>{" "}
                        <span className="text-pink-900/80">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-pink-900">💌 DM ({threads.length})</h2>
        {threads.length === 0 ? (
          <div className="card p-5 text-center text-xs text-pink-900/50">아직 DM이 없어요</div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-bold text-pink-900">
                    @{t.princessId.replace(/_$/, "").replace("_princess", "").replace("_diary", "")}
                  </div>
                  <div className="text-[11px] text-pink-900/50">
                    {new Date(t.updatedAt).toLocaleString("ko-KR")}
                  </div>
                </div>
                {t.messages[0] ? (
                  <div className="text-[12px] text-pink-900/80">
                    {t.messages[0].fromMe ? "→ " : "← "}{t.messages[0].text}
                  </div>
                ) : null}
                {t.unread > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t.unread}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
