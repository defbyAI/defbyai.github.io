import { MathUtils } from "three";
import type { Language } from "../../src/data/products";
import { enclosure, mm } from "../../src/lib/zeropl/fold-preview-geometry";
import { createPageTurnProjection } from "../../src/lib/zeropl/fold-preview-projection";
import { createFoldPreviewScene } from "../../src/lib/zeropl/fold-preview-scene";

export const width = 1440;
export const height = 810;
export const fps = 24;
export const frameCount = 132;

const foldStart = fps;
const foldEnd = foldStart + 32;
const revealStart = foldEnd + fps;
const revealEnd = revealStart + 34;

// The screen is 21.5 inches diagonally. The body adds a bezel and a lower chin.
const panel = { width: 21.5 * 25.4 * 16 / Math.hypot(16, 9), height: 21.5 * 25.4 * 9 / Math.hypot(16, 9) };
const bezel = 5.5;
const monitorWidth = panel.width + bezel * 2;
const monitorHeight = panel.height + 16;
const standHeight = 74;
const phoneWidth = enclosure.width / mm(1);
const phoneHeight = enclosure.height / mm(1);
const deviceGap = 45;
const setupWidth = phoneWidth + deviceGap + monitorWidth;
const setupScale = width * .88 / setupWidth;
const setupX = (width - setupWidth * setupScale) / 2;
const floorY = height * .91;

export function poseFrame(frame: number) {
  if (frame <= foldStart) return 0;
  if (frame > foldEnd && frame <= revealStart) return foldEnd;
  return Math.min(frame, revealEnd);
}

function canvas(width: number, height: number) {
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  return layer;
}

function round(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, fill: string | CanvasGradient) {
  context.beginPath();
  context.roundRect(x, y, w, h, radius);
  context.fillStyle = fill;
  context.fill();
}

function crop(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number, zoom = 1, position = .5) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * zoom;
  const sourceWidth = w / scale;
  const sourceHeight = h / scale;
  context.drawImage(image, (image.naturalWidth - sourceWidth) * position,
    (image.naturalHeight - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, w, h);
}

function photoWorkspace(lang: Language, photo: HTMLImageElement, coast: HTMLImageElement) {
  const screen = canvas(1280, 720);
  const context = screen.getContext("2d", { alpha: false })!;
  const ko = lang === "ko";
  const editorName = ko ? "사진 편집" : "Photo Editor";
  const text = (label: string, x: number, y: number, size: number, color = "#e7ecf2", weight = 400) => {
    context.fillStyle = color;
    context.font = `${weight} ${size}px -apple-system, "Apple SD Gothic Neo", sans-serif`;
    context.fillText(label, x, y);
  };

  const desktop = context.createLinearGradient(0, 0, 1280, 720);
  desktop.addColorStop(0, "#4c677e");
  desktop.addColorStop(.5, "#283b51");
  desktop.addColorStop(1, "#1e2c40");
  context.fillStyle = desktop;
  context.fillRect(0, 0, 1280, 720);
  context.fillStyle = "#162133a0";
  context.fillRect(0, 0, 1280, 31);
  text(editorName, 25, 22, 17, "#fff", 650);
  text(ko ? "파일     편집     보기" : "File     Edit     View", 153, 22, 17);
  text("9:41", 1219, 22, 17);

  context.shadowColor = "#0a10198c";
  context.shadowBlur = 25;
  context.shadowOffsetY = 9;
  round(context, 37, 51, 1206, 634, 14, "#222833");
  context.shadowColor = "transparent";
  round(context, 38, 52, 1204, 48, 12, "#393f49");
  context.fillStyle = "#393f49";
  context.fillRect(38, 81, 1204, 20);
  ["#f4877e", "#f5c575", "#7ac696"].forEach((color, index) => {
    round(context, 58 + index * 23, 70, 13, 13, 6.5, color);
  });
  context.textAlign = "center";
  text(ko ? "해안 사진" : "Coastal photographs", 640, 83, 21, "#f3f5f9", 620);
  context.textAlign = "left";

  crop(context, photo, 55, 117, 888, 475);
  context.fillStyle = "#2d333f";
  context.fillRect(961, 101, 280, 575);
  text(ko ? "조정" : "Adjustments", 982, 140, 23, "#f2f4f8", 650);
  round(context, 982, 161, 235, 83, 5, "#1b212c");

  const sample = canvas(144, 90).getContext("2d", { willReadFrequently: true })!;
  sample.drawImage(photo, 0, 0, 144, 90);
  const pixels = sample.getImageData(0, 0, 144, 90).data;
  const histogram = new Uint16Array(48);
  for (let i = 0; i < pixels.length; i += 4) {
    const luminance = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
    histogram[Math.floor(luminance * histogram.length / 256)]++;
  }
  const peak = Math.max(...histogram);
  context.fillStyle = "#a7c4e1";
  histogram.forEach((value, index) => {
    const h = 63 * value / peak;
    context.fillRect(992 + index * 4.45, 233 - h, 3.6, h);
  });
  const adjustments = ko ? ["노출", "대비", "밝은 영역", "채도"] : ["Exposure", "Contrast", "Highlights", "Saturation"];
  const values = ["+0.20", "+8", "−12", "+4"];
  const points = [.56, .58, .40, .54];
  adjustments.forEach((label, index) => {
    const y = 283 + index * 72;
    text(label, 982, y, 18);
    context.textAlign = "right";
    text(values[index], 1217, y, 16, "#b8c4d4", 500);
    context.textAlign = "left";
    round(context, 982, y + 16, 235, 4, 2, "#626a79");
    round(context, 982 + 235 * points[index] - 6, y + 12, 12, 12, 6, "#e4edf5");
  });
  round(context, 55, 604, 95, 66, 5, "#a4d4fd");
  crop(context, photo, 58, 607, 89, 60);
  crop(context, coast, 160, 607, 84, 60);
  crop(context, photo, 254, 607, 84, 60, 2.15, .15);
  return screen;
}

function shadow(context: CanvasRenderingContext2D, center: number, bottom: number, w: number, h: number, opacity: number) {
  context.save();
  context.translate(center, bottom);
  context.scale(w / 2, h / 2);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, `rgba(16, 29, 26, ${opacity})`);
  gradient.addColorStop(1, "rgba(16, 29, 26, 0)");
  context.fillStyle = gradient;
  context.fillRect(-1, -1, 2, 2);
  context.restore();
}

function drawMonitor(context: CanvasRenderingContext2D, screen: HTMLCanvasElement, x: number, bottom: number, opacity: number, scale: number) {
  context.save();
  context.globalAlpha = opacity;
  shadow(context, x + monitorWidth * scale / 2, bottom + 2, monitorWidth * scale * .88, 35, .4);
  context.translate(x, bottom - (monitorHeight + standHeight) * scale);
  context.scale(scale, scale);
  const center = monitorWidth / 2;
  const metal = context.createLinearGradient(0, monitorHeight - 4, 0, monitorHeight + standHeight);
  metal.addColorStop(0, "#525b5c");
  metal.addColorStop(.47, "#99a2a1");
  metal.addColorStop(.92, "#c5c9c6");
  metal.addColorStop(1, "#717a79");
  context.beginPath();
  context.moveTo(center - 26, monitorHeight - 4);
  context.lineTo(center + 26, monitorHeight - 4);
  context.lineTo(center + 38, monitorHeight + standHeight - 14);
  context.lineTo(center + 82, monitorHeight + standHeight - 5);
  context.quadraticCurveTo(center + 85, monitorHeight + standHeight, center + 80, monitorHeight + standHeight);
  context.lineTo(center - 80, monitorHeight + standHeight);
  context.quadraticCurveTo(center - 85, monitorHeight + standHeight, center - 82, monitorHeight + standHeight - 5);
  context.lineTo(center - 38, monitorHeight + standHeight - 14);
  context.closePath();
  context.fillStyle = metal;
  context.fill();
  const edge = context.createLinearGradient(0, 0, monitorWidth, monitorHeight);
  edge.addColorStop(0, "#656f73");
  edge.addColorStop(.5, "#293031");
  edge.addColorStop(1, "#545d60");
  round(context, 0, 0, monitorWidth, monitorHeight, 6.5, edge);
  round(context, .9, .9, monitorWidth - 1.8, monitorHeight - 1.8, 5.8, "#141819");
  context.drawImage(screen, bezel, bezel, panel.width, panel.height);
  round(context, monitorWidth - 12, monitorHeight - 6.2, 1.9, 1.9, .95, "#89a49e");
  context.restore();
}

export async function createTitleFrame(host: HTMLElement, lang: Language, dark: boolean) {
  const duoPath = `/twort/duo/${lang === "ko" ? "ko/" : ""}`;
  const suffix = dark ? "-dark.webp" : ".webp";
  const cover = duoPath + "folded" + suffix;
  const inner = duoPath + "open-landscape" + suffix;
  const scene = createFoldPreviewScene(host, {
    pageTurnProjection: createPageTurnProjection,
    seamlessWhenOpen: true,
    // Multisampled depth can reveal a sliver of metal through the screen at the hinge.
    antialias: false,
  });
  const loadImage = async (url: string) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  };
  const [textures, photo, coast] = await Promise.all([
    scene.loadCaptures([cover, cover, inner]),
    loadImage("/twort/chalk-coast.webp"),
    loadImage("/twort/coast-study.webp"),
  ]);
  const monitor = photoWorkspace(lang, photo, coast);
  const phone = canvas(width, height);
  const phoneContext = phone.getContext("2d")!;
  phoneContext.imageSmoothingQuality = "high";
  const output = canvas(width, height);
  const context = output.getContext("2d", { alpha: false })!;
  const backdrop = context.createRadialGradient(width / 2, height * .42, 0, width / 2, height * .42, width * .67);
  backdrop.addColorStop(0, dark ? "#303936" : "#fafbf7");
  backdrop.addColorStop(1, dark ? "#181e1c" : "#e8ece5");

  const distance = 6.32;
  const closeScale = height * mm(1) / (2 * Math.tan(MathUtils.degToRad(17)) * distance);
  let lastOpening = -1;
  return (frame: number) => {
    const opening = MathUtils.smootherstep(frame, foldStart, foldEnd);
    if (opening !== lastOpening) {
      lastOpening = opening;
      scene.render({
        previous: 0, next: 2, active: opening < .5 ? 0 : 2, dissolve: 0,
        opening: 180 * opening, roll: 0, tilt: 0,
        yaw: 0, elevation: 0, distance, targetY: 0,
      }, textures);
      phoneContext.clearRect(0, 0, width, height);
      phoneContext.drawImage(scene.canvas, 0, 0, width, height);
    }
    const zoom = MathUtils.smootherstep(frame, revealStart, revealEnd);
    const monitorMotion = MathUtils.smootherstep(frame, revealStart + 4, revealEnd);
    context.fillStyle = backdrop;
    context.fillRect(0, 0, width, height);

    if (monitorMotion > 0) {
      const x = MathUtils.lerp(width * .85, setupX + (phoneWidth + deviceGap) * setupScale, monitorMotion);
      const opacity = MathUtils.smoothstep(frame, revealStart + 4, revealEnd - 9);
      drawMonitor(context, monitor, x, floorY, opacity, setupScale);
    }
    const pixelsPerMM = MathUtils.lerp(closeScale, setupScale, zoom);
    const scale = pixelsPerMM / closeScale;
    const phoneX = MathUtils.lerp(width / 2, setupX + phoneWidth * setupScale / 2, zoom);
    const phoneY = floorY - phoneHeight * pixelsPerMM / 2;
    const apparentWidth = MathUtils.lerp(enclosure.foldedWidth / mm(1), phoneWidth, opening) * pixelsPerMM;
    shadow(context, phoneX, floorY + 3, apparentWidth * 1.33, 40, dark ? .57 : .22);
    context.drawImage(phone, phoneX - width * scale / 2, phoneY - height * scale / 2, width * scale, height * scale);
    return output;
  };
}
