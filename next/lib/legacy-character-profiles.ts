// Legacy 사이트(public/legacy/index.html)에서 추출한 CHARACTER_PROFILES.
// 일회성 DB 시드용으로 사용 (scripts/seed-character-profiles.ts).
// 편집은 관리자 페이지에서 DB로 직접 수행. 이 파일은 시드 후 사실상 read-only.

export type LegacyComment = { id: string; text: string };
export type LegacyPost = {
  emoji: string;
  image: string;
  images?: string[];
  caption: string;
  comments: LegacyComment[];
};
export type LegacyProfile = {
  name: string;
  img: string;
  grade: string;
  friends: number;
  bio: string;
  theme: [string, string];
  posts: LegacyPost[];
};

export const LEGACY_CHARACTER_PROFILES: Record<string, LegacyProfile> = {
  momo__o: {
    name: "momo 복숭이", img: "assets/momo_/momo_profile/momo.png", grade: "🍑", friends: 102,
    bio: "맛있는 걸 먹으면 하루가 조금 더 행복해져 🍑\n오늘 뭐 먹지? 같이 먹을 사람 구함",
    theme: ["#fde2c4", "#f6a96b"],
    posts: [
      { emoji: "👑", image: "assets/momo_/momo_a/momo_a1.png",
        caption: "아 배고프다… 누가 같이 먹어줄 사람?🍑 오늘 메뉴 추천 받음ㅋㅋ",
        comments: [
          { id: "ruby_", text: "야 같이 먹자!! 나도 배고팠어ㅋㅋ 뭐 시킬까??💎" },
          { id: "lily_princess", text: "공주 끼니 거르면 안 돼ㅠ 따뜻한 거 챙겨먹어🌿" },
          { id: "sora_diary", text: "오늘 분위기 너무 귀여워☁️ 셀카 진짜 잘 나왔다" }
        ] },
      { emoji: "👗", image: "assets/momo_/momo_b/momo_b2.png",
        caption: "풀드레스 입고 출동🍑 디저트 한 입 못 참고 베어 물 예정ㅋㅋ 다이어트?? 그게 뭐야",
        comments: [
          { id: "ruby_", text: "드레스 미쳤다!! 우리 디저트 파티 가는 거지??💎✨" },
          { id: "lily_princess", text: "드레스 색감이 너무 부드러워🌷 봄 햇살 같아☀️" },
          { id: "sora_diary", text: "코디 색 조합 진짜 잘 맞춰☁️ 분위기 미쳤어" }
        ] },
      { emoji: "🍓", image: "assets/momo_/momo_c/momo_c3.png",
        caption: "헐 잠깐만… 딸기 쇼트케이크는 진짜 행복해지는 맛이잖아ㅠㅠ🍓 당 충전은 생각보다 중요하다구🍑",
        comments: [
          { id: "ruby_", text: "딸기 케이크?? 나도 한 입ㅠㅠ💎 다음엔 같이 먹자!!" },
          { id: "lily_princess", text: "딸기는 작은 행복이지🌷 보기만 해도 마음 따뜻해져" },
          { id: "sora_diary", text: "비주얼 진짜 예뻐… 저장각이야☁️" }
        ] }
    ]
  },
  ruby_: {
    name: "rubyRuby 비비", img: "assets/ruby_/ruby_profile/ruby.png", grade: "❤️", friends: 1366,
    bio: "친구들이랑 함께 있는 순간이 세상에서 제일 행복해!!💎\n파티 좋아하는 사람 DM 환영ㅋㅋ✨",
    theme: ["#fecaca", "#dc2626"],
    posts: [
      { emoji: "❤️", image: "assets/ruby_/ruby_a/ruby_a1.png",
        caption: "오늘 텐션 미쳤다 진짜ㅋㅋ💎 친구들아 봐줘 봐줘!! 오늘의 셀카📸✨",
        comments: [
          { id: "momo__o", text: "너무 예뻐🍑 인생샷 업로드 기념 야식 콜?? 떡볶이 어때" },
          { id: "lily_princess", text: "공주 표정이 햇살 같아☀️ 보는 나도 기분 좋아져🌼" },
          { id: "sora_diary", text: "오늘 메이크업 분위기 진짜 예쁘다… 립 컬러 알려줘☁️" }
        ] },
      { emoji: "👗", image: "assets/ruby_/ruby_b/ruby_b2.png",
        caption: "드레스 입은 김에 파티 한 번 가야 하는 거 아니야??💎 같이 갈 사람 손!!✨",
        comments: [
          { id: "momo__o", text: "파티 가면 무조건 디저트 싹쓸이 해야지🍑 ㅋㅋ" },
          { id: "lily_princess", text: "드레스 너무 예뻐… 봄꽃 같아🌷" },
          { id: "sora_diary", text: "공주 분위기 미쳤어 진짜☁️ 헤어도 잘 어울려" }
        ] },
      { emoji: "📖", image: "assets/ruby_/ruby_c/ruby_c1.png",
        images: ["assets/ruby_/ruby_e/ruby_e1.png"],
        caption: "오늘은 책 읽는 척ㅋㅋ📖 사실 친구들한테 보낼 사진 찍는 중이었음💎 우정 영원해!!",
        comments: [
          { id: "momo__o", text: "ㅋㅋㅋ책 읽는 척 너무 티 남🍑 차 한 잔 같이 시킬 걸" },
          { id: "lily_princess", text: "램프 불빛 분위기 너무 따뜻해🍃 그대로 한 페이지 같아" },
          { id: "sora_diary", text: "이런 무드 사진 진짜 잘 찍어… 저장☁️" },
          { id: "pearl_diary", text: "책 한 권의 사치는 결코 작지 않아. 잘 골랐어." }
        ] },
      { emoji: "🍰", image: "assets/ruby_/ruby_d/ruby_d1.png",
        images: ["assets/ruby_/ruby_d/ruby_d1.png", "assets/ruby_/ruby_d/ruby_d2.png"],
        caption: "레드벨벳 + 장미 티타임 시즌 오픈🍰🌹 친구들 다 불러서 미니 파티 열 거임ㅋㅋ💖",
        comments: [
          { id: "momo__o", text: "레드벨벳?? 헐 나 그거 미친 듯이 좋아해🍑 무조건 갈 거임" },
          { id: "lily_princess", text: "장미 향이랑 케이크라니… 너무 사랑스러워🌷" },
          { id: "sora_diary", text: "테이블 컬러 톤 너무 예뻐☁️ 사진 한 장 더 찍어줘" }
        ] },
      { emoji: "🪞", image: "assets/ruby_/ruby_e/ruby_e1.png",
        caption: "거울 셋이면 셀카 무한이지ㅋㅋ🪞✨ 친구들아 댓글로 베스트 각도 골라줘!!💎",
        comments: [
          { id: "momo__o", text: "나는 가운데가 베스트ㅋㅋ🍑 끝나고 같이 밥 먹자" },
          { id: "lily_princess", text: "왼쪽 분위기가 제일 부드러워🌼 표정이 햇살 같아" },
          { id: "sora_diary", text: "오른쪽☁️ 머릿결이랑 피부톤 살아있는 각도야" }
        ] },
      { emoji: "🐶", image: "assets/ruby_/ruby_f/ruby_f1.png",
        images: ["assets/ruby_/ruby_f/ruby_f1.png", "assets/ruby_/ruby_f/ruby_f2.png"],
        caption: "비 오는 날 산책 메이트🐶💖 얘 없으면 외로움 진짜 폭발인데ㅋㅋ 다음엔 너네도 같이 가자!!",
        comments: [
          { id: "momo__o", text: "비 오는 날엔 산책하고 호떡 사 먹어야지ㅋㅋ🍑" },
          { id: "lily_princess", text: "비 냄새랑 강아지라니… 너무 사랑스러워🍃 잘 챙겨줘서 다행이야" },
          { id: "sora_diary", text: "비 오는 거리 분위기 너무 좋아☁️ 다음엔 나도 같이 가자" }
        ] },
      { emoji: "💎", image: "assets/ruby_/ruby_g/ruby_g1.png",
        images: ["assets/ruby_/ruby_g/ruby_g1.png", "assets/ruby_/ruby_g/ruby_g2.png", "assets/ruby_/ruby_g/ruby_g3.png", "assets/ruby_/ruby_g/ruby_g4.png"],
        caption: "헐 잠깐만… 하트 루비 펜던트 손에 넣었다구!!💎👑 친구들한테 자랑 안 할 수가 없잖아ㅋㅋ✨",
        comments: [
          { id: "momo__o", text: "와 반짝반짝 진짜ㅋㅋ🍑 자랑할 만하다 진심" },
          { id: "lily_princess", text: "루비 꽃말이 \"열정\"이래🌷 공주랑 잘 어울려" },
          { id: "sora_diary", text: "펜던트 컬러가 피부톤이랑 너무 잘 맞아☁️" },
          { id: "pearl_diary", text: "품격 있는 선택이야. 오래 간직할 만한 보석이지." }
        ] },
      { emoji: "✨", image: "assets/ruby_/ruby_h/ruby_h1.png",
        images: ["assets/ruby_/ruby_h/ruby_h1.png", "assets/ruby_/ruby_h/ruby_h2.png"],
        caption: "오늘도 반짝반짝 마무리✨❤️ 너네 덕분에 매일이 파티 같아ㅋㅋ💎 우린 베프잖아 영원히!!",
        comments: [
          { id: "momo__o", text: "베프지 당연ㅋㅋ🍑 내일 점심 같이 먹자" },
          { id: "lily_princess", text: "공주 덕분에 하루가 환해져🌼 고마워" },
          { id: "sora_diary", text: "오늘 분위기 진짜 반짝였어☁️ 잘 자" }
        ] }
    ]
  },
  lily_princess: {
    name: "lily 백합", img: "assets/lily_/lily_profile/lily.png", grade: "🤍", friends: 88,
    bio: "꽃말처럼 조용히 마음을 안아주는, 햇살빛 힐링 공주 🌼\n천천히 피어나는 마음도 아름다워🌷",
    theme: ["#e0e7ff", "#a78bfa"],
    posts: [
      { emoji: "🌼", image: "assets/lily_/lily_a/lily_a1.png",
        images: ["assets/lily_/lily_a/lily_a1.png", "assets/lily_/lily_a/lily_a2.png"],
        caption: "들판 가득 데이지가 피어 있던 오후🌼\n데이지 꽃말은 \"희망\"이래☀️ 오늘 공주에게도 그 희망이 닿았으면🍃",
        comments: [
          { id: "momo__o", text: "들판에서 피크닉이지!!🍑 샌드위치 싸 들고 같이 가고 싶어" },
          { id: "ruby_", text: "청춘 영화 같잖아ㅠㅠ✨ 다음엔 나도 데려가줘 진짜!!💎" },
          { id: "sora_diary", text: "햇살 받은 분위기 너무 예뻐☁️ 색감이 너무 부드러워" }
        ] },
      { emoji: "🍵", image: "assets/lily_/lily_b/lily_b1.png",
        caption: "작은 부케와 따뜻한 차 한 잔🍵🌷\n꽃도 피는 속도가 다 다르잖아. 천천히 괜찮아져도 돼🌿",
        comments: [
          { id: "momo__o", text: "차랑 같이 먹을 디저트 추천해줄까?🍑 마들렌 강추" },
          { id: "ruby_", text: "분위기 너무 좋다ㅠ💎 이런 날엔 나도 차 마시고 싶어져" },
          { id: "sora_diary", text: "부케 색 조합이 너무 사랑스러워☁️ 마음이 잔잔해져" },
          { id: "pearl_diary", text: "조용한 오후는 그 자체로 사치야. 잘 보냈어." }
        ] }
    ]
  },
  sora_diary: {
    name: "sora 하늘", img: "assets/sora_/sora_profile/sora.png", grade: "☁️", friends: 77,
    bio: "예뻐지고 싶고, 예쁘게 기억되고 싶어 ☁️\n작은 분위기 하나에도 마음이 흔들리는, 하늘빛 감성 뷰티 공주",
    theme: ["#dbeafe", "#60a5fa"],
    posts: [
      { emoji: "🧜‍♀️", image: "assets/sora_/sora_a/sora_a1.png",
        caption: "오늘은 하늘색 분위기로 가봤어☁️\n물결 웨이브 헤어랑 윤광 메이크업 조합… 이 분위기 너무 좋아서 한참 봤어",
        comments: [
          { id: "momo__o", text: "하늘색 분위기 미쳤다🍑 카페 가서 사진 더 찍자" },
          { id: "ruby_", text: "헐 메이크업 진짜 예뻐!!💎 다음 모임 룩 이걸로 가자✨" },
          { id: "lily_princess", text: "하늘빛 색감이 정말 잘 어울려☀️ 마음이 차분해져🍃" }
        ] },
      { emoji: "🦪", image: "assets/sora_/sora_b/sora_b1.png",
        images: ["assets/sora_/sora_b/sora_b1.png", "assets/sora_/sora_b/sora_b2.png", "assets/sora_/sora_b/sora_b3.png"],
        caption: "오늘의 액세서리는 진주✨ 잔잔한 빛이 피부톤이랑 잘 맞는 것 같아\n어떤 게 제일 예뻐 보여..? 저장각 알려줘",
        comments: [
          { id: "momo__o", text: "두 번째!! 진주 작은 게 더 귀여워🍑 끝나고 디저트 카페ㄱ?" },
          { id: "ruby_", text: "진주 너무 사랑이야ㅠㅠ💎 우리 같이 차고 사진 찍자!!" },
          { id: "lily_princess", text: "진주 빛이 잔잔해서 너에게 잘 어울려🌿" },
          { id: "pearl_diary", text: "진주는 절제된 아름다움이지. 안목이 좋아." }
        ] },
      { emoji: "✂️", image: "assets/sora_/sora_c/sora_c1.png",
        images: ["assets/sora_/sora_c/sora_c1.png", "assets/sora_/sora_c/sora_c2.png", "assets/sora_/sora_c/sora_c3.png", "assets/sora_/sora_c/sora_c4.png", "assets/sora_/sora_c/sora_c5.png", "assets/sora_/sora_c/sora_c6.png", "assets/sora_/sora_c/sora_c7.png"],
        caption: "요즘 머릿결 좀 신경 쓰여서… 단발 시절 사진 다시 꺼내봤어🥺\n앞머리 자를까..? 같이 관리하자 우리☁️",
        comments: [
          { id: "momo__o", text: "둘 다 예뻐ㅠㅠ🍑 결정 어려우면 일단 같이 밥부터 먹자" },
          { id: "ruby_", text: "단발 진짜 잘 어울려!!💎 자르면 같이 미용실 가자ㅋㅋ" },
          { id: "lily_princess", text: "머리는 천천히 결정해도 돼🌷 어떤 모습이든 예뻐" }
        ] }
    ]
  },
  pearl_diary: {
    name: "pearl 진주", img: "assets/pearl_/pearl_profile/pearl.png", grade: "🐚", friends: 64,
    bio: "곧 왕위를 이어받을, 가장 조용하고 가장 현실적인 공주.\n감정에 휘둘리지 않고 스스로를 다스리는 것.",
    theme: ["#cffafe", "#22d3ee"],
    posts: [
      { emoji: "🕯️", image: "assets/pearl_/pearl_a/pearl_a1.png",
        caption: "새벽의 서재.\n품격은 스스로를 다스리는 일에서 시작된다.\n그 또한 지나갈 거라 믿어.",
        comments: [
          { id: "momo__o", text: "공주 새벽까지 안 잔 거야?ㅠ🍑 야식이라도 챙겨먹어" },
          { id: "ruby_", text: "공주님 멋있다 진짜💎 근데 너무 무리하진 마요ㅠ" },
          { id: "lily_princess", text: "고요한 밤 분위기가 공주와 잘 어울려🌿 따뜻한 차 한 잔과 함께" },
          { id: "sora_diary", text: "이 분위기 진짜 진주빛이야☁️ 새벽 무드 너무 예뻐" }
        ] }
    ]
  }
};

/** legacy의 상대 경로 (`assets/...`)를 next.config 리라이트로 접근 가능한 절대 경로로 변환. */
export function legacyAssetUrl(rel: string): string {
  if (!rel) return rel;
  if (/^(https?:|data:|\/)/.test(rel)) return rel;
  return `/app/${rel}`;
}
