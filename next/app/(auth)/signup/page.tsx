"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput, MBTI_TYPES } from "@/lib/zod-schemas";

type Prefix = "princess_" | "prince_";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefix, setPrefix] = useState<Prefix>("princess_");
  const [nameSuffix, setNameSuffix] = useState("");
  const [termsOpen, setTermsOpen] = useState<null | "tos" | "privacy">(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      interests: [],
      agreedTos: false as unknown as true,
      agreedPrivacy: false as unknown as true
    }
  });

  useEffect(() => {
    setValue("name", `${prefix}${nameSuffix}`, { shouldValidate: nameSuffix.length > 0 });
  }, [prefix, nameSuffix, setValue]);

  const togglePrefix = () => setPrefix((p) => (p === "princess_" ? "prince_" : "princess_"));

  const onSubmit = async (data: SignupInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, interests: [] })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (json.error === "EmailExists") {
          setServerError("이미 가입된 이메일이에요");
        } else if (json.error === "RateLimited") {
          setServerError("잠시 후 다시 시도해주세요");
        } else {
          setServerError("회원가입에 실패했어요. 잠시 후 다시 시도해주세요.");
        }
        return;
      }
      router.push(`/login?email=${encodeURIComponent(data.email)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-5 py-8">
      <h1 className="mb-1 text-2xl font-bold text-pink-700">회원가입</h1>
      <p className="mb-6 text-xs text-pink-900/70">
        프로필 정보를 입력해주세요 👑
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5">
        <div>
          <label className="field-label">이메일</label>
          <input className="field-input" type="email" {...register("email")} placeholder="you@example.com" />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="field-label">비밀번호</label>
          <input
            className="field-input"
            type="password"
            {...register("password")}
            placeholder="8자 이상, 영문+숫자"
          />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>

        <div>
          <label className="field-label">비밀번호 확인</label>
          <input
            className="field-input"
            type="password"
            {...register("passwordConfirm")}
            placeholder="비밀번호를 한 번 더 입력"
          />
          {errors.passwordConfirm && <p className="field-error">{errors.passwordConfirm.message}</p>}
        </div>

        <div>
          <label className="field-label">ID</label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-pink-200 bg-white focus-within:border-pink-400">
            <button
              type="button"
              onClick={togglePrefix}
              className="w-24 shrink-0 select-none border-r border-pink-200 bg-pink-50 pl-3 text-left text-sm font-semibold text-pink-600 transition hover:bg-pink-100"
              title="클릭하여 princess_ / prince_ 전환"
            >
              {prefix}
            </button>
            <input
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-pink-300"
              value={nameSuffix}
              onChange={(e) => setNameSuffix(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
              placeholder="아이디 입력"
              maxLength={20 - prefix.length}
            />
            <span
              title="영문만 입력 가능"
              aria-label="영문 입력"
              className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center self-center rounded-md border border-pink-300 bg-white text-xs font-bold text-pink-500"
            >
              A
            </span>
          </div>
          <input type="hidden" {...register("name")} />
          <p className="mt-1 text-[11px] text-pink-500/80">
            앞부분을 눌러 princess_ / prince_ 전환
          </p>
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="field-label">이름</label>
          <input
            className="field-input"
            {...register("princessName")}
            placeholder="이름을 입력해주세요"
          />
          {errors.princessName && <p className="field-error">{errors.princessName.message}</p>}
        </div>

        <div>
          <label className="field-label">생년월일</label>
          <input className="field-input" type="date" {...register("birthDate")} />
          {errors.birthDate && <p className="field-error">{errors.birthDate.message}</p>}
        </div>

        <div>
          <label className="field-label">태어난 시간 (선택)</label>
          <input className="field-input" type="time" {...register("birthTime")} />
          {errors.birthTime && <p className="field-error">{errors.birthTime.message}</p>}
        </div>

        <div>
          <label className="field-label">MBTI (선택)</label>
          <select className="field-input" {...register("mbti")} defaultValue="">
            <option value="">선택하지 않음</option>
            {MBTI_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.mbti && <p className="field-error">{errors.mbti.message as string}</p>}
        </div>

        <div className="space-y-2 rounded-xl bg-pink-50/60 p-3">
          <label className="flex items-start gap-2 text-xs text-pink-900/80">
            <input type="checkbox" {...register("agreedTos")} className="mt-0.5" />
            <span>
              <button
                type="button"
                onClick={() => setTermsOpen("tos")}
                className="font-semibold text-pink-600 underline underline-offset-2 hover:text-pink-700"
              >
                서비스
              </button>
              {" "}이용약관에 동의합니다 (필수)
            </span>
          </label>
          {errors.agreedTos && <p className="field-error">{errors.agreedTos.message as string}</p>}
          <label className="flex items-start gap-2 text-xs text-pink-900/80">
            <input type="checkbox" {...register("agreedPrivacy")} className="mt-0.5" />
            <span>
              <button
                type="button"
                onClick={() => setTermsOpen("privacy")}
                className="font-semibold text-pink-600 underline underline-offset-2 hover:text-pink-700"
              >
                개인정보
              </button>
              {" "}처리방침에 동의합니다 (필수)
            </span>
          </label>
          {errors.agreedPrivacy && <p className="field-error">{errors.agreedPrivacy.message as string}</p>}
        </div>

        {serverError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{serverError}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "가입 중..." : "가입하고 이메일 인증하기"}
        </button>

        <p className="text-center text-xs text-pink-900/70">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-pink-600">
            로그인
          </Link>
        </p>
      </form>

      {termsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center sm:pb-0"
          onClick={() => setTermsOpen(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-pink-100 bg-pink-50 px-4 py-3">
              <h2 className="text-sm font-bold text-pink-700">
                {termsOpen === "tos" ? "서비스 이용약관" : "개인정보 처리방침"}
              </h2>
              <button
                type="button"
                onClick={() => setTermsOpen(null)}
                className="text-pink-500 hover:text-pink-700"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-4 py-4 text-xs leading-relaxed text-pink-900/80">
              {termsOpen === "tos" ? (
                <div className="space-y-3">
                  <p>본 약관은 서비스 이용에 관한 기본 사항을 규정합니다.</p>
                  <p><b>1조 (목적)</b> 회원과 서비스 사이의 권리·의무·책임 사항을 정합니다.</p>
                  <p><b>2조 (이용 계약)</b> 회원가입 양식 작성 및 약관 동의로 이용 계약이 성립합니다.</p>
                  <p><b>3조 (회원의 의무)</b> 타인의 정보 도용 및 서비스 운영 방해 행위를 금지합니다.</p>
                  <p><b>4조 (서비스 변경)</b> 서비스의 일부 기능은 사전 공지 후 변경·종료될 수 있습니다.</p>
                  <p><b>5조 (면책)</b> 천재지변 및 회원의 귀책 사유로 인한 손해에 대해서는 책임지지 않습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>회원 정보 보호를 위한 처리방침을 안내합니다.</p>
                  <p><b>1. 수집 항목</b> 이메일, 비밀번호(암호화), 닉네임, 이름, 생년월일, (선택) 태어난 시간·MBTI</p>
                  <p><b>2. 수집 목적</b> 회원 식별, 이메일 인증, 맞춤형 콘텐츠 제공, 서비스 운영 및 개선</p>
                  <p><b>3. 보유 기간</b> 회원 탈퇴 시 지체 없이 파기, 단 법령상 의무 보관 기간은 예외</p>
                  <p><b>4. 제3자 제공</b> 원칙적으로 외부에 제공하지 않으며, 법령에 따른 요청 시에만 제공</p>
                  <p><b>5. 권리</b> 본인 정보 열람·수정·삭제·동의 철회를 요청할 수 있습니다.</p>
                </div>
              )}
            </div>
            <div className="border-t border-pink-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setTermsOpen(null)}
                className="btn-primary w-full"
              >
                확인했어요
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
