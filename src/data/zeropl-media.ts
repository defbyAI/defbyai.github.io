import type { Language } from "./zeropl";

export const filmLicense = "https://creativecommons.org/licenses/by/3.0/";

export const films = {
  cosmos: {
    title: "Cosmos Laundromat",
    year: 2015,
    source: "https://gooseberry.blender.org/",
    terms: "https://gooseberry.blender.org/license/",
    credit: "(CC) Blender Foundation | gooseberry.blender.org",
    video: "/zeropl/media/cosmos-forest.mp4",
    poster: "/zeropl/media/cosmos-forest.webp",
    range: "08:48–08:54",
    placement: { ko: "첫 화면 · 환상 속의 숲", en: "Opening scene · An otherworldly forest" },
    edits: {
      ko: "6초 발췌에 음성을 제거하고 크기 조정 및 재인코딩을 적용했습니다. 첫 화면은 Mac 재생 캡처이고, 크레딧 이미지는 08:50에서 추출했습니다.",
      en: "6-second excerpt, resized and re-encoded without audio. The hero shows Mac playback, and the credit still comes from 08:50.",
    },
  },
  sintel: {
    title: "Sintel",
    year: 2010,
    source: "https://durian.blender.org/",
    terms: "https://durian.blender.org/sharing/",
    credit: "© copyright Blender Foundation | www.sintel.org",
    video: "/zeropl/media/sintel-conversation.mp4",
    poster: "/zeropl/media/sintel-conversation.webp",
    range: "02:07–02:26",
    placement: { ko: "실시간 번역 · 누군가를 찾는 이야기", en: "Live translation · Searching for someone" },
    edits: {
      ko: "영어 음성을 포함한 19초 발췌, 크기 조정 및 재인코딩. Duo에서 자막 없이 재생한 뒤 zeroPL이 생성한 한국어 자막을 캡처했습니다. 크레딧 이미지는 02:14에서 추출했습니다.",
      en: "19-second excerpt with English audio, resized and re-encoded. zeroPL generated the Korean subtitle shown in the Duo capture. The credit still comes from 02:14.",
    },
  },
  bunny: {
    title: "Big Buck Bunny",
    year: 2008,
    source: "https://peach.blender.org/",
    terms: "https://peach.blender.org/about/",
    credit: "(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org",
    video: "/zeropl/media/bunny-meadow.mp4",
    poster: "/zeropl/media/bunny-meadow.webp",
    range: "01:05–01:14",
    placement: { ko: "기기별 비교 · iPhone Duo · 브라우저", en: "Device comparison · iPhone Duo · Browser" },
    edits: {
      ko: "Sunflower 배포본의 9초 발췌, 음성 제거, 크기 조정 및 재인코딩. Mac·iPad·Duo 비교와 크레딧 정지 화면은 01:07 장면을 사용합니다.",
      en: "9-second excerpt from the Sunflower release, resized and re-encoded without audio. The comparison and credit still use the frame at 01:07.",
    },
  },
};

export type FilmId = keyof typeof films;

export const mediaText: Record<Language, {
  credits: string; details: string;
  heading: string; introduction: string; original: string; terms: string; edits: string;
}> = {
  ko: {
    credits: "영상 출처·라이선스", details: "출처·편집 내역",
    heading: "이야기를 빌려온 곳.",
    introduction: "이 페이지의 세 작품은 Blender Foundation의 오픈 무비입니다. 각 발췌 영상과 정지 장면은 CC BY 3.0에 따라 사용합니다.",
    original: "원작 보기", terms: "원작 사용 조건", edits: "편집 내역",
  },
  en: {
    credits: "Film credits & licenses", details: "Credits & edits",
    heading: "The stories on our screens.",
    introduction: "The three films on this page are Blender Foundation open movies. Excerpts and still frames are used under CC BY 3.0.",
    original: "View original", terms: "Original usage terms", edits: "Edits",
  },
};

