import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/app/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="card w-full p-7 text-center">
        <div className="mb-3 text-4xl">👑</div>
        <h1 className="mb-1 text-2xl font-bold text-pink-700">Princessgram</h1>
        <p className="mb-6 text-sm text-pink-900/70">
          공주들과 함께하는 작은 SNS에 오신 걸 환영해요 🌸
        </p>
        <div className="space-y-2">
          <Link href="/login" className="btn-primary w-full">로그인</Link>
          <Link href="/signup" className="btn-ghost w-full">회원가입</Link>
        </div>
      </div>
    </main>
  );
}
