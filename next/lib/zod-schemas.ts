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

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP"
] as const;

const birthTimeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

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
    birthDate: z.string().min(1, "생년월일을 입력해주세요"), // ISO date string
    birthTime: z
      .string()
      .regex(birthTimeRegex, "HH:MM 형식이어야 해요")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    mbti: z
      .enum(MBTI_TYPES)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    interests: z.array(z.enum(INTERESTS)).default([]),
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

export const profileUpdateSchema = z.object({
  username: z.string().min(2).max(20).optional(),
  princessName: z.string().min(1).max(20).optional(),
  bio: z.string().max(300).optional(),
  birthDate: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  birthTime: z
    .string()
    .regex(birthTimeRegex, "HH:MM 형식이어야 해요")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  mbti: z
    .enum(MBTI_TYPES)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  avatarUrl: z.string().optional(),
  interests: z.array(z.enum(INTERESTS)).optional()
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

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

// ───── 공주 프로필/게시글 ─────
export const princessProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  avatarUrl: z.string().max(20_000_000).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  personality: z.record(z.any()).optional()
});

const princessCommentSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(500)
});

export const princessPostCreateSchema = z.object({
  princessId: z.string().min(1).max(64),
  imageUrl: z.string().max(20_000_000).nullable().optional(),
  imageUrls: z.array(z.string().max(20_000_000)).max(10).optional(),
  text: z.string().min(1).max(2200),
  emoji: z.string().max(8).nullable().optional(),
  comments: z.array(princessCommentSchema).max(20).optional(),
  position: z.number().int().min(0).optional()
});

export const princessPostUpdateSchema = z.object({
  imageUrl: z.string().max(20_000_000).nullable().optional(),
  imageUrls: z.array(z.string().max(20_000_000)).max(10).optional(),
  text: z.string().min(1).max(2200).optional(),
  emoji: z.string().max(8).nullable().optional(),
  comments: z.array(princessCommentSchema).max(20).optional(),
  position: z.number().int().min(0).optional()
});
