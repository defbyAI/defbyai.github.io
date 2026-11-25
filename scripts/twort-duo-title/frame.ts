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

const phoneWidth = enclosure.width / mm(1);
const phoneHeight = enclosure.height / mm(1);
const deviceGap = 45;
const floorY = height * .91;

interface MonitorLayout {
  left: number;
  width: number;
  bottom: number;
  screenWidth: number;
  screenHeight: number;
}

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

export async function createTitleFrame(host: HTMLElement, lang: Language, dark: boolean, monitorLayout: MonitorLayout) {
  const duoPath = `/twort/duo/${lang === "ko" ? "ko/" : ""}`;
  const suffix = dark ? "-dark.webp" : ".webp";
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
  const [textures, monitor] = await Promise.all([
    scene.loadCaptures(["/cover.png", "/cover.png", inner]),
    loadImage("/monitor.png"),
  ]);
  // Scale the capture against the active panel's 21.5-inch diagonal.
  const monitorWidth = 21.5 * 25.4 * monitorLayout.width / Math.hypot(monitorLayout.screenWidth, monitorLayout.screenHeight);
  const setupWidth = phoneWidth + deviceGap + monitorWidth;
  const setupScale = width * .88 / setupWidth;
  const setupX = (width - setupWidth * setupScale) / 2;
  const monitorScale = monitorWidth * setupScale / monitorLayout.width;
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
      context.save();
      context.globalAlpha = MathUtils.smoothstep(frame, revealStart + 4, revealEnd - 9);
      context.drawImage(monitor,
        x - monitorLayout.left * monitorScale, floorY - monitorLayout.bottom * monitorScale,
        monitor.naturalWidth * monitorScale, monitor.naturalHeight * monitorScale);
      context.restore();
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
