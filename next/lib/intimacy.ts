/**
 * 친밀도 계산.
 * - action 종류별로 가중치를 두고 누적.
 * - 음의 이벤트(경고/모더레이션)는 감점.
 * - 같은 사용자×공주 row가 없으면 upsert.
 */
export type IntimacyAction =
  | "like"
  | "comment"
  | "reply"
  | "dm_send"
  | "dm_receive"
  | "post_view"
  | "profile_view"
  | "moderation_yes"     // §9 모달에서 "예" 선택
  | "moderation_no"      // §9 모달에서 "아니오" — 큰 감점
  | "inappropriate";     // 감지된 부적절 발언

export const INTIMACY_WEIGHTS: Record<IntimacyAction, number> = {
  like: 2,
  comment: 4,
  reply: 5,
  dm_send: 6,
  dm_receive: 1,
  post_view: 0.2,
  profile_view: 0.5,
  moderation_yes: 1,
  moderation_no: -15,
  inappropriate: -5
};

export function weightFor(action: IntimacyAction): number {
  return INTIMACY_WEIGHTS[action] ?? 0;
}
