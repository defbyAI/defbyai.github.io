import { CanvasTexture, MathUtils, SRGBColorSpace } from "three";
import { createPageTurnProjection } from "../../src/lib/zeropl/fold-preview-projection";
import { createFoldPreviewScene } from "../../src/lib/zeropl/fold-preview-scene";

// Frame numbers on the 24 fps film timeline. The completed opening holds for one second.
const openingStarts = 36;
const fullyOpen = 79;
const hideStarts = fullyOpen + 24;
const hideEnds = hideStarts + 5;

type Appearance = "light" | "dark";
type Capture = "cover" | "controls" | "hidden";
type GetFrame = (capture: Capture, frame: number) => Promise<CanvasImageSource>;

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function makeDisplay(width: number, height: number) {
  const canvas = makeCanvas(width, height);
  const context = canvas.getContext("2d", { alpha: false })!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { context, texture };
}

function paintCapture(context: CanvasRenderingContext2D, image: CanvasImageSource, opacity = 1) {
  context.globalAlpha = opacity;
  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
  context.globalAlpha = 1;
  if (image instanceof ImageBitmap) image.close();
}

export function createTitleFrame(host: HTMLElement, appearance: Appearance, getFrame: GetFrame) {
  const scene = createFoldPreviewScene(host, { pageTurnProjection: createPageTurnProjection });
  const cover = makeDisplay(664, 966);
  const inner = makeDisplay(1352, 950);
  const displays = [cover.texture, cover.texture, inner.texture];
  const output = makeCanvas(host.clientWidth, host.clientHeight);
  const context = output.getContext("2d", { alpha: false })!;
  const { width, height } = output;
  const dark = appearance === "dark";
  const backdrop = context.createRadialGradient(width * 0.5, height * 0.45, 0,
    width * 0.5, height * 0.45, width * 0.63);
  backdrop.addColorStop(0, dark ? "#303936" : "#fafbf7");
  backdrop.addColorStop(1, dark ? "#181d1c" : "#e9ede7");

  return async (frame: number) => {
    const opening = MathUtils.smoothstep(frame, openingStarts, fullyOpen);
    const hidden = MathUtils.smoothstep(frame, hideStarts, hideEnds);
    if (opening < 1) {
      paintCapture(cover.context, await getFrame("cover", frame));
      cover.texture.needsUpdate = true;
    }
    if (opening > 0) {
      if (hidden < 1) paintCapture(inner.context, await getFrame("controls", frame));
      if (hidden > 0) paintCapture(inner.context, await getFrame("hidden", frame), hidden);
      inner.texture.needsUpdate = true;
    }

    scene.render({
      previous: 0, next: 2, active: opening < 0.5 ? 0 : 2, dissolve: 0,
      opening: 180 * opening, roll: 0, tilt: 0, targetY: 0,
      yaw: 1.5 * opening,
      elevation: 1.5 * opening,
      distance: MathUtils.lerp(6.24, 5.96, opening),
    }, displays);

    context.fillStyle = backdrop;
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height * 0.939);
    context.scale(width * MathUtils.lerp(0.19, 0.34, opening), height * 0.037);
    const shadow = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    shadow.addColorStop(0, dark ? "rgba(0,0,0,.33)" : "rgba(42,56,50,.17)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = shadow;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
    context.drawImage(scene.canvas, 0, 0, width, height);
    return output.toDataURL("image/png");
  };
}
