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
    recording: {
      video: "/zeropl/captures/sintel-translation-mac.mp4",
      poster: "/zeropl/captures/sintel-translation-mac.webp",
      width: 1280,
      height: 720,
    },
    range: "02:07–02:26",
    placement: { ko: "실시간 번역 · 누군가를 찾는 이야기", en: "Live translation · Searching for someone" },
    edits: {
      ko: "19초 발췌를 Mac의 zeroPL에서 재생하며 영어 음성과 앱이 만든 한국어 자막을 녹화했습니다. 화면 여백을 잘라내고 음량을 조정했습니다. 크레딧 이미지는 02:14에서 추출했습니다.",
      en: "The 19-second excerpt was recorded in zeroPL on macOS with the English audio and the app’s Korean subtitles. The recording was cropped and the audio level adjusted. The credit still comes from 02:14.",
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
      ko: "Sunflower 배포본의 9초 발췌, 음성 제거, 크기 조정 및 재인코딩. 기기별 재생 화면은 01:09, 크레딧 이미지는 01:07의 장면입니다.",
      en: "9-second excerpt from the Sunflower release, resized and re-encoded without audio. The device mosaic shows 01:09. The credit still shows 01:07.",
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
    heading: "데모에 사용한 영화",
    introduction: "이 페이지의 세 작품은 Blender Foundation의 오픈 무비입니다. 각 발췌 영상과 정지 장면은 CC BY 3.0에 따라 사용합니다.",
    original: "원작 보기", terms: "원작 사용 조건", edits: "편집 내역",
  },
  en: {
    credits: "Film credits & licenses", details: "Credits & edits",
    heading: "Films used in the demos",
    introduction: "The three films on this page are Blender Foundation open movies. Excerpts and still frames are used under CC BY 3.0.",
    original: "View original", terms: "Original usage terms", edits: "Edits",
  },
};

