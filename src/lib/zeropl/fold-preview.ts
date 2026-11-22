import { clampProgress, sampleFold, type FoldKeyframe } from "./fold-preview-poses";
import type { createFoldPreviewScene } from "./fold-preview-scene";
import { captureAppearance, captureAppearanceChange, type CaptureAppearance } from "./capture-appearance";

type Scene = ReturnType<typeof createFoldPreviewScene>;
type Textures = Awaited<ReturnType<Scene["loadCaptures"]>>;

function mountFoldPreview(story: HTMLElement) {
  const stage = story.querySelector<HTMLElement>("[data-fold-stage]")!;
  const viewer = story.querySelector<HTMLElement>("[data-fold-viewer]")!;
  const host = story.querySelector<HTMLElement>("[data-fold-canvas]")!;
  const image = story.querySelector<HTMLImageElement>("[data-fold-fallback]")!;
  const darkImage = story.querySelector<HTMLSourceElement>("[data-fold-dark]")!;
  const controls = story.querySelector<HTMLElement>("[data-fold-controls]")!;
  const progressBar = story.querySelector<HTMLElement>("[data-fold-progress]")!;
  const copies = [...story.querySelectorAll<HTMLElement>("[data-fold-copy]")];
  const frames: FoldKeyframe[] = JSON.parse(story.dataset.foldFrames!);
  const accessoryIndex = copies.findIndex(copy => copy.hasAttribute("data-fold-accessory"));
  const buttons = [...story.querySelectorAll<HTMLButtonElement>("[data-fold-pose]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cache = new Map<CaptureAppearance, Promise<Textures>>();
  let active = 0;
  let target = 0;
  let current = 0;
  let frame = 0;
  let lastFrame = 0;
  let request = 0;
  let shouldLoadScene = false;
  let unavailable = false;
  let scenePromise: Promise<Scene> | undefined;
  let scene: Scene | undefined;
  let textures: Textures | undefined;

  const captureUrl = (copy: HTMLElement, mode: CaptureAppearance) => copy.dataset[mode] || copy.dataset.light!;

  function updateImage() {
    const copy = copies[active];
    darkImage.srcset = captureUrl(copy, "dark");
    image.src = captureUrl(copy, "light");
    image.alt = copy.dataset.alt!;
    image.width = Number(copy.dataset.width);
    image.height = Number(copy.dataset.height);
  }

  function schedule() {
    frame ||= window.requestAnimationFrame(draw);
  }

  function draw(now: number) {
    frame = 0;
    const elapsed = lastFrame ? Math.min(now - lastFrame, 32) : 16;
    current = reducedMotion.matches || Math.abs(target - current) < 0.001
      ? target
      : current + (target - current) * (1 - Math.exp(-elapsed / 80));
    const sample = sampleFold(current, frames);
    const accessoryReveal = (sample.previous === accessoryIndex ? 1 - sample.dissolve : 0)
      + (sample.next === accessoryIndex ? sample.dissolve : 0);
    if (accessoryIndex >= 0) {
      viewer.style.setProperty("--accessory-reveal", String(accessoryReveal));
    }
    if (active !== sample.active) {
      active = sample.active;
      copies.forEach((copy, index) => { copy.hidden = index !== active; });
      buttons.forEach((button, index) => { button.setAttribute("aria-pressed", String(index === active)); });
      updateImage();
    }
    progressBar.style.transform = `scaleX(${current})`;
    if (scene && textures && !unavailable && !reducedMotion.matches) {
      scene.render(sample, textures, accessoryReveal, captureAppearance === "dark");
      viewer.classList.add("has-3d");
    }
    lastFrame = current === target ? 0 : now;
    if (current !== target) schedule();
  }

  const scrollDistance = () => reducedMotion.matches ? 0 : Math.max(0, story.offsetHeight - stage.offsetHeight);

  function followScroll() {
    const distance = scrollDistance();
    if (distance <= 0) return;
    const scrolled = Math.round(-story.getBoundingClientRect().top);
    const progress = clampProgress(scrolled / distance);
    if (progress === target) return;
    target = progress;
    schedule();
  }

  function resize() {
    followScroll();
    schedule();
  }

  function watchPixelRatio() {
    const resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    resolution.addEventListener("change", () => {
      resize();
      watchPixelRatio();
    }, { once: true });
  }

  function select(index: number) {
    const position = frames[index].at;
    const distance = scrollDistance();
    if (distance > 0) {
      window.scrollTo({ top: window.scrollY + story.getBoundingClientRect().top + distance * position, behavior: "smooth" });
      return;
    }
    target = position;
    schedule();
  }

  async function loadAppearance() {
    const mode = captureAppearance;
    const id = ++request;
    if (!shouldLoadScene || unavailable || reducedMotion.matches) {
      textures = undefined;
      viewer.classList.remove("has-3d");
      return;
    }

    try {
      scenePromise ??= Promise.all([
        import("./fold-preview-scene"),
        accessoryIndex >= 0 ? import("../twort/keyboard-model") : undefined,
      ]).then(([{ createFoldPreviewScene }, keyboardModule]) => {
        const preview = createFoldPreviewScene(host, { keyboardModule });
        preview.canvas.addEventListener("webglcontextlost", () => {
          unavailable = true;
          viewer.classList.remove("has-3d");
        }, { once: true });
        return preview;
      });
      const preview = await scenePromise;
      if (id !== request || unavailable) return;

      let pending = cache.get(mode);
      if (!pending) {
        pending = preview.loadCaptures(copies.map(copy => captureUrl(copy, mode))).catch(error => {
          cache.delete(mode);
          throw error;
        });
        cache.set(mode, pending);
      }
      const frames = await pending;
      if (id === request && !unavailable) {
        scene = preview;
        textures = frames;
        schedule();
      }
    } catch {
      if (id === request) {
        textures = undefined;
        viewer.classList.remove("has-3d");
      }
    }
  }

  story.classList.add("is-interactive");
  controls.hidden = false;
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
        : (index + offset + buttons.length) % buttons.length;
      buttons[next].focus({ preventScroll: true });
      select(next);
    });
  });
  document.addEventListener(captureAppearanceChange, loadAppearance);
  window.addEventListener("scroll", followScroll, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule, { passive: true });
  watchPixelRatio();
  const resizeObserver = new ResizeObserver(resize);
  try {
    resizeObserver.observe(host, { box: "device-pixel-content-box" });
  } catch {
    resizeObserver.observe(host);
  }
  reducedMotion.addEventListener("change", () => {
    resize();
    void loadAppearance();
  });
  const intersection = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    intersection.disconnect();
    shouldLoadScene = true;
    void loadAppearance();
  }, { rootMargin: "640px 0px" });
  intersection.observe(stage);
  followScroll();
  current = target;
}

const foldStory = document.querySelector<HTMLElement>("[data-fold-story]");
if (foldStory) mountFoldPreview(foldStory);
