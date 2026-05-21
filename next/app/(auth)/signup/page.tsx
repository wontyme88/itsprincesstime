"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput, INTERESTS, MBTI_TYPES } from "@/lib/zod-schemas";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      interests: [],
      agreedTos: false as unknown as true,
      agreedPrivacy: false as unknown as true
    }
  });

  const selectedInterests = watch("interests") ?? [];

  const toggleInterest = (it: (typeof INTERESTS)[number]) => {
    const next = selectedInterests.includes(it)
      ? selectedInterests.filter((x) => x !== it)
      : [...selectedInterests, it];
    setValue("interests", next, { shouldValidate: true });
  };

  const onSubmit = async (data: SignupInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
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
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-5 py-8">
      <h1 className="mb-1 text-2xl font-bold text-pink-700">회원가입</h1>
      <p className="mb-6 text-xs text-pink-900/70">
        공주들과 만나기 전, 작은 자기소개 ✨
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5">
        <div>
          <label className="field-label">이메일</label>
          <input className="field-input" type="email" {...register("email")} placeholder="you@example.com" />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="field-label">비밀번호</label>
          <input className="field-input" type="password" {...register("password")} placeholder="8자 이상, 영문+숫자" />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>

        <div>
          <label className="field-label">비밀번호 확인</label>
          <input className="field-input" type="password" {...register("passwordConfirm")} />
          {errors.passwordConfirm && <p className="field-error">{errors.passwordConfirm.message}</p>}
        </div>

        <div>
          <label className="field-label">닉네임</label>
          <input className="field-input" {...register("name")} placeholder="princess_chae" />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="field-label">내 공주 이름</label>
          <input className="field-input" {...register("princessName")} placeholder="예: 백합" />
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

        <div>
          <label className="field-label">관심사 (1개 이상)</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((it) => (
              <button
                type="button"
                key={it}
                onClick={() => toggleInterest(it)}
                data-checked={selectedInterests.includes(it)}
                className="interest-chip"
              >
                {it}
              </button>
            ))}
          </div>
          {errors.interests && <p className="field-error">{errors.interests.message as string}</p>}
        </div>

        <div className="space-y-2 rounded-xl bg-pink-50/60 p-3">
          <label className="flex items-start gap-2 text-xs text-pink-900/80">
            <input type="checkbox" {...register("agreedTos")} className="mt-0.5" />
            <span>서비스 이용약관에 동의합니다 (필수)</span>
          </label>
          {errors.agreedTos && <p className="field-error">{errors.agreedTos.message as string}</p>}
          <label className="flex items-start gap-2 text-xs text-pink-900/80">
            <input type="checkbox" {...register("agreedPrivacy")} className="mt-0.5" />
            <span>개인정보 처리방침에 동의합니다 (필수)</span>
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
    </main>
  );
}
