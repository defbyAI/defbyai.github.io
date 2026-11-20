import type { Language } from "./zeropl";

type Localized = Record<Language, string>;

export interface DeviceCapture {
  light: string;
  dark?: string;
  width: number;
  height: number;
  alt: Localized;
}

const duoLandscape: DeviceCapture = {
  light: "/zeropl/captures/comparison-duo-light.webp",
  dark: "/zeropl/captures/comparison-duo-dark.webp",
  width: 1200,
  height: 844,
  alt: {
    ko: "펼친 가로 모드의 iPhone Duo에서 일시정지한 Big Buck Bunny와 오른쪽 세로 도구 모음",
    en: "Big Buck Bunny paused on an open iPhone Duo in landscape, with a vertical toolbar on the right",
  },
};

export const duoPoseCaptures: Partial<Record<string, DeviceCapture>> = {
  folded: {
    light: "/zeropl/captures/duo-folded-light.webp",
    dark: "/zeropl/captures/duo-folded-dark.webp",
    width: 950,
    height: 1246,
    alt: {
      ko: "접은 세로 모드의 iPhone Duo 외부 화면에서 일시정지한 Big Buck Bunny",
      en: "Big Buck Bunny paused on the folded iPhone Duo’s outer display in portrait",
    },
  },
  "folded-landscape": {
    light: "/zeropl/captures/duo-folded-landscape-light.webp",
    dark: "/zeropl/captures/duo-folded-landscape-dark.webp",
    width: 1200,
    height: 825,
    alt: {
      ko: "접은 가로 모드에서 화면을 넓게 채운 Big Buck Bunny와 가운데 재생 컨트롤",
      en: "Big Buck Bunny on the outer landscape display, with playback controls centered over the video",
    },
  },
  open: {
    light: "/zeropl/captures/duo-open-light.webp",
    dark: "/zeropl/captures/duo-open-dark.webp",
    width: 950,
    height: 1350,
    alt: {
      ko: "펼친 세로 화면에서 위에는 Big Buck Bunny, 아래에는 파일 탐색과 재생 컨트롤을 배치한 zeroPL",
      en: "zeroPL in open portrait, with Big Buck Bunny above the file browser and playback controls",
    },
  },
  "open-landscape": duoLandscape,
  seated: {
    light: "/zeropl/captures/duo-seated-light.webp",
    dark: "/zeropl/captures/duo-seated-dark.webp",
    width: 950,
    height: 1350,
    alt: {
      ko: "iPhone Duo 세워 보기에서 위쪽의 Big Buck Bunny와 아래쪽의 데모 영상 기록 및 재생 컨트롤",
      en: "Big Buck Bunny above the fold, with recent demo films and playback controls on the lower half of iPhone Duo",
    },
  },
};

export const captures = {
  hero: {
    light: "/zeropl/captures/mac-cosmos.webp",
    width: 1480,
    height: 981,
    alt: {
      ko: "Mac의 zeroPL에서 Cosmos Laundromat의 분홍빛 숲을 재생하는 화면",
      en: "Cosmos Laundromat’s pink forest playing in zeroPL on a Mac",
    },
  },
  web: {
    light: "/zeropl/captures/duo-web-light.webp",
    dark: "/zeropl/captures/duo-web-dark.webp",
    width: 1200,
    height: 844,
    alt: {
      ko: "iPhone Duo의 zeroPL 브라우저에서 Big Buck Bunny 페이지와 왼쪽 아래 미니 플레이어가 함께 보이는 화면",
      en: "Big Buck Bunny in zeroPL’s browser on iPhone Duo, with the mini-player at the lower left",
    },
  },
} satisfies Record<string, DeviceCapture>;
