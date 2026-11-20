import type { DeviceCapture } from "./zeropl-captures";

const poses = {
  window: { ko: "재생 창", en: "Player window" },
  portrait: { ko: "세로 재생", en: "Portrait playback" },
  landscape: { ko: "가로 재생", en: "Landscape playback" },
  foldedPortrait: { ko: "접은 세로", en: "Folded portrait" },
  foldedLandscape: { ko: "접은 가로", en: "Folded landscape" },
  openPortrait: { ko: "펼친 세로", en: "Open portrait" },
  openLandscape: { ko: "펼친 가로", en: "Open landscape" },
  seated: { ko: "세워 보기", en: "Tabletop playback" },
};

function display(label: string, shortEdge: number, longEdge: number, ppi: number) {
  return { label, shortEdge, longEdge, ppi };
}

// Native display resolution and pixel density from Apple's specifications.
const panels = {
  // The Mac tile shows the captured player window.
  mac: { label: "Mac", shortEdge: 1086, longEdge: 1680, ppi: null },
  ipadPro: display("iPad Pro 13″", 2064, 2752, 264),
  ipad: display("iPad", 1640, 2360, 264),
  ipadMini: display("iPad mini", 1512, 2316, 326),
  iphone: display("iPhone 17", 1206, 2622, 460),
  iphoneProMax: display("iPhone 18 Pro Max", 1320, 2868, 460),
  duoCover: display("iPhone Duo", 1398, 2034, 460),
  duoInner: display("iPhone Duo", 1878, 2670, 430),
} as const;

type Panel = (typeof panels)[keyof typeof panels];
type MosaicCapture = DeviceCapture & { widthInches: number | null; aspectRatio: number };

function screen(id: string, panel: Panel, pose: keyof typeof poses, width: number, height: number): MosaicCapture {
  const landscape = pose === "window" || pose === "landscape" || pose === "foldedLandscape" || pose === "openLandscape";
  const nativeWidth = landscape ? panel.longEdge : panel.shortEdge;
  const nativeHeight = landscape ? panel.shortEdge : panel.longEdge;
  // Resizing a complete screen can round its short edge by a pixel.
  const expectedShortEdge = Math.max(width, height) * panel.shortEdge / panel.longEdge;
  if ((width > height) !== landscape || Math.abs(Math.min(width, height) - expectedShortEdge) > 1) {
    throw new Error(`Mosaic capture ${id} must match the full ${panel.label} frame in its specified orientation.`);
  }
  return {
    light: `/zeropl/mosaic/${id}-light.webp`,
    dark: `/zeropl/mosaic/${id}-dark.webp`,
    width, height,
    widthInches: panel.ppi === null ? null : nativeWidth / panel.ppi,
    aspectRatio: nativeWidth / nativeHeight,
    alt: { ko: `${panel.label} · ${poses[pose].ko}`, en: `${panel.label} · ${poses[pose].en}` },
  };
}

type Center = [x: number, y: number];

interface MosaicTile {
  capture: MosaicCapture;
  tilt: number;
  wide: Center;
  medium: Center;
  narrow: Center;
}

// Keep the existing Mac and landscape iPad Pro widths as the two layout anchors.
const ipadProWidthInches = panels.ipadPro.longEdge / panels.ipadPro.ppi;
export const mosaicBoards = {
  wide: { width: 1060, height: 324, unitsPerInch: 190 / ipadProWidthInches, macWidth: 245 },
  medium: { width: 650, height: 267, unitsPerInch: 133 / ipadProWidthInches, macWidth: 172 },
  narrow: { width: 380, height: 372, unitsPerInch: 122 / ipadProWidthInches, macWidth: 149 },
} as const;

export const mosaicTiles: MosaicTile[] = [
  {
    capture: screen("mac-window", panels.mac, "window", 1500, 970),
    tilt: -4.6, wide: [451, 95], medium: [274, 141], narrow: [86, 189],
  },
  {
    capture: screen("iphone-17-portrait", panels.iphone, "portrait", 589, 1280),
    // A landscape tile separates the two upright iPhones on their shared baseline.
    tilt: 0, wide: [832, 76], medium: [494, 64], narrow: [106, 48],
  },
  {
    capture: screen("ipad-mini-a20-pro-landscape", panels.ipadMini, "landscape", 1280, 836),
    tilt: -3.5, wide: [107, 57], medium: [172, 36], narrow: [145, 336],
  },
  {
    capture: screen("iphone-18-pro-max-landscape", panels.iphoneProMax, "landscape", 1280, 589),
    tilt: 4.2, wide: [635, 281], medium: [323, 231], narrow: [213, 266],
  },
  {
    capture: screen("iphone-duo-folded-portrait", panels.duoCover, "foldedPortrait", 880, 1280),
    tilt: 2.8, wide: [382, 241], medium: [157, 220], narrow: [141, 274],
  },
  {
    capture: screen("ipad-pro-13-inch-m5-landscape", panels.ipadPro, "landscape", 1280, 960),
    tilt: -2.1, wide: [948, 229], medium: [506, 188], narrow: [310, 61],
  },
  {
    capture: screen("iphone-17-landscape", panels.iphone, "landscape", 1280, 589),
    tilt: -4.1, wide: [699, 37], medium: [323, 33], narrow: [136, 104],
  },
  {
    capture: screen("ipad-a16-landscape", panels.ipad, "landscape", 1280, 889),
    tilt: 4.7, wide: [258, 256], medium: [70, 216], narrow: [317, 315],
  },
  {
    capture: screen("iphone-duo-open-landscape", panels.duoInner, "openLandscape", 1280, 900),
    tilt: 3.5, wide: [924, 67], medium: [558, 51], narrow: [165, 35],
  },
  {
    capture: screen("ipad-mini-a20-pro-portrait", panels.ipadMini, "portrait", 836, 1280),
    tilt: -4.5, wide: [794, 243], medium: [613, 198], narrow: [44, 69],
  },
  {
    capture: screen("iphone-duo-folded-landscape", panels.duoCover, "foldedLandscape", 1280, 880),
    tilt: 4.5, wide: [758, 136], medium: [221, 240], narrow: [336, 223],
  },
  {
    capture: screen("ipad-a16-portrait", panels.ipad, "portrait", 889, 1280),
    tilt: -2.2, wide: [647, 158], medium: [417, 71], narrow: [55, 302],
  },
  {
    capture: screen("iphone-duo-seated-portrait", panels.duoInner, "seated", 900, 1280),
    tilt: 5.1, wide: [249, 77], medium: [401, 201], narrow: [345, 153],
  },
  {
    capture: screen("ipad-pro-13-inch-m5-portrait", panels.ipadPro, "portrait", 960, 1280),
    tilt: 2.8, wide: [88, 212], medium: [59, 83], narrow: [232, 178],
  },
  {
    capture: screen("iphone-duo-open-portrait", panels.duoInner, "openPortrait", 900, 1280),
    tilt: 3.2, wide: [489, 254], medium: [148, 125], narrow: [229, 328],
  },
  {
    capture: screen("iphone-18-pro-max-portrait", panels.iphoneProMax, "portrait", 589, 1280),
    tilt: 0, wide: [1017, 71.13], medium: [623, 60.59], narrow: [225, 44.87],
  },
];
