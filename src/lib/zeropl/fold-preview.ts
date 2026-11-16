import { clampProgress, foldPoses, sampleFold } from "./fold-preview-poses";
import type { createFoldPreviewScene } from "./fold-preview-scene";
import { captureAppearance, captureAppearanceChange, type CaptureAppearance } from "./capture-appearance";

type Scene = ReturnType<typeof createFoldPreviewScene>;
type Textures = Awaited<ReturnType<Scene["loadCaptures"]>>;

function mountFoldPreview(story: HTMLElement) {
  const stage = story.querySelector<HTMLElement>("[data-fold-stage]")!;
  const viewer = story.querySelector<HTMLElement>("[data-fold-viewer]")!;
  const host = story.querySelector<HTMLElement>("[data-fold-canvas]")!;
  const image = story.querySelector<HTMLImageElement>("[data-fold-fallback]")!;
  const controls = story.querySelector<HTMLElement>("[data-fold-controls]")!;
  const progressBar = story.querySelector<HTMLElement>("[data-fold-progress]")!;
  const copies = [...story.querySelectorAll<HTMLElement>("[data-fold-copy]")];
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
    const src = captureUrl(copy, captureAppearance);
    if (image.getAttribute("src") !== src) image.src = src;
    image.alt = copy.dataset.alt!;
    image.width = Number(copy.dataset.width);
    image.height = Number(copy.dataset.height);
  }

  function schedule() {
    frame ||= window.requestAnimationFrame(draw);
  }

  function draw(now: number) {
    frame = 0;
    const elapsed = lastFrame ? now - lastFrame : 16;
    current = reducedMotion.matches || Math.abs(target - current) < 0.001
      ? target
      : current + (target - current) * (1 - Math.exp(-elapsed / 80));
    const sample = sampleFold(current);
    if (active !== sample.active) {
      active = sample.active;
      copies.forEach((copy, index) => { copy.hidden = index !== active; });
      buttons.forEach((button, index) => { button.setAttribute("aria-pressed", String(index === active)); });
      updateImage();
    }
    progressBar.style.transform = `scaleX(${current})`;
    if (scene && textures && !unavailable && !reducedMotion.matches) {
      scene.render(sample, textures);
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
    const position = foldPoses[index].at;
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
    textures = undefined;
    viewer.classList.remove("has-3d");
    if (!shouldLoadScene || unavailable || reducedMotion.matches) return;

    try {
      scenePromise ??= import("./fold-preview-scene").then(({ createFoldPreviewScene }) => {
        const preview = createFoldPreviewScene(host);
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
      if (id === request) viewer.classList.remove("has-3d");
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
  document.addEventListener(captureAppearanceChange, () => {
    updateImage();
    void loadAppearance();
  });
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
  }, { rootMargin: "320px 0px" });
  intersection.observe(host);
  followScroll();
  current = target;
  updateImage();
}

const foldStory = document.querySelector<HTMLElement>("[data-fold-story]");
if (foldStory) mountFoldPreview(foldStory);
