export type CaptureAppearance = "light" | "dark";
export const captureAppearanceChange = "zeropl:capture-appearance";
export let captureAppearance: CaptureAppearance = "light";

const buttons = document.querySelectorAll<HTMLButtonElement>("[data-capture-mode]");

for (const button of buttons) {
  button.addEventListener("click", () => {
    const mode = button.dataset.captureMode === "dark" ? "dark" : "light";
    if (mode === captureAppearance) return;
    captureAppearance = mode;
    for (const option of buttons) {
      option.setAttribute("aria-pressed", String(option.dataset.captureMode === mode));
    }
    for (const image of document.querySelectorAll<HTMLImageElement>("img[data-capture-dark]")) {
      const source = mode === "dark" ? image.dataset.captureDark : image.dataset.captureLight;
      if (source && image.getAttribute("src") !== source) image.src = source;
    }
    document.dispatchEvent(new Event(captureAppearanceChange));
  });
}
