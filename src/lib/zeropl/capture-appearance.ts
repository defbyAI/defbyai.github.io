export type CaptureAppearance = "light" | "dark";
export const captureAppearanceChange = "zeropl:capture-appearance";

const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
export let captureAppearance: CaptureAppearance = darkScheme.matches ? "dark" : "light";

darkScheme.addEventListener("change", ({ matches }) => {
  captureAppearance = matches ? "dark" : "light";
  document.dispatchEvent(new Event(captureAppearanceChange));
});
