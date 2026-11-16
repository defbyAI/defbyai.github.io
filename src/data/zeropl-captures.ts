import type { Language } from "./zeropl";

type Localized = Record<Language, string>;

export interface DeviceCapture {
  light: string;
  dark?: string;
  width: number;
  height: number;
  alt: Localized;
}

interface PlatformCapture {
  name: string;
  description: Localized;
  capture: DeviceCapture;
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

export const platformCaptures: PlatformCapture[] = [
  {
    name: "Mac",
    description: {
      ko: "데스크톱 창에 재생과 볼륨 조절을 모았습니다. Mac 플레이어는 시스템 외관과 관계없이 어두운 테마를 사용합니다.",
      en: "Playback and volume controls share a desktop window. The Mac player has a dark appearance in both system modes.",
    },
    capture: {
      light: "/zeropl/captures/comparison-mac.webp",
      width: 1120,
      height: 743,
      alt: {
        ko: "Mac의 zeroPL에서 Big Buck Bunny를 일시정지한 화면과 하단 재생 컨트롤",
        en: "Big Buck Bunny paused in the zeroPL Mac window, with playback controls along the bottom",
      },
    },
  },
  {
    name: "iPad",
    description: {
      ko: "넓은 화면에서 영상과 파일 목록을 나란히 열어 두고, 아래에서 재생을 조절합니다.",
      en: "Keep your video and file browser side by side, with playback controls below.",
    },
    capture: {
      light: "/zeropl/captures/comparison-ipad-light.webp",
      dark: "/zeropl/captures/comparison-ipad-dark.webp",
      width: 1200,
      height: 900,
      alt: {
        ko: "iPad의 zeroPL에서 일시정지한 Big Buck Bunny와 왼쪽 파일 탐색 패널",
        en: "Big Buck Bunny paused in zeroPL on iPad, with the file browser open on the left",
      },
    },
  },
  {
    name: "iPhone Duo",
    description: {
      ko: "펼친 가로 화면을 넓게 쓰고, 오른쪽의 세로 도구 모음에서 라이브러리와 네트워크 드라이브를 열 수 있습니다.",
      en: "Use the full inner display in open landscape, with a vertical toolbar for the library and network drives.",
    },
    capture: duoLandscape,
  },
];
