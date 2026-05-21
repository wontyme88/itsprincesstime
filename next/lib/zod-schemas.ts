import { z } from "zod";

export const INTERESTS = [
  "연애",
  "뷰티",
  "음식",
  "공부",
  "커리어",
  "인간관계",
  "멘탈관리",
  "패션"
] as const;

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 해요")
  .regex(/[A-Za-z]/, "영문을 포함해주세요")
  .regex(/[0-9]/, "숫자를 포함해주세요");

export const signupSchema = z
  .object({
    email: z.string().email("이메일 형식이 올바르지 않아요"),
    password: passwordSchema,
    passwordConfirm: z.string(),
    name: z.string().min(2, "닉네임은 2자 이상이어야 해요").max(20),
    princessName: z.string().min(1, "공주 이름을 입력해주세요").max(20),
    birthDate: z.string().optional(), // ISO date string
    interests: z.array(z.enum(INTERESTS)).min(1, "관심사를 1개 이상 선택해주세요"),
    agreedTos: z.literal(true, { errorMap: () => ({ message: "이용약관에 동의해주세요" }) }),
    agreedPrivacy: z.literal(true, {
      errorMap: () => ({ message: "개인정보 처리방침에 동의해주세요" })
    })
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 일치하지 않아요"
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "6자리 숫자를 입력해주세요")
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
