export const productNames = {
  zeropl: "zeroPL",
  twort: "twoRT",
} as const;

export type Product = keyof typeof productNames;
export type Language = "en" | "ko";

export function productPath(product: Product, lang: Language) {
  return `/${lang}/${product}/`;
}

export function productEntryPath(product: Product) {
  return `/${product}/`;
}
