import { productPath, type Language, type Product } from "../data/products";

// Keep preferences saved before the product pages shared language selection.
const storageKey = "zeropl-language";

export function browserLanguage(): Language {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of languages) {
    const language = tag.toLowerCase().split("-")[0];
    if (language === "ko" || language === "en") return language;
  }
  return "en";
}

export function savedLanguage(): Language | null {
  try {
    const language = localStorage.getItem(storageKey);
    if (language === "ko" || language === "en") return language;
  } catch {
    // Storage may be disabled in the browser.
  }
  return null;
}

export function preferredLanguage(): Language {
  return savedLanguage() ?? browserLanguage();
}

export function rememberLanguage(language: Language | null) {
  try {
    if (language) localStorage.setItem(storageKey, language);
    else localStorage.removeItem(storageKey);
  } catch {
    // The language links also work without storing a preference.
  }
}

export function redirectToPreferredProduct(product: Product) {
  const destination = new URL(location.href);
  destination.pathname = productPath(product, preferredLanguage());
  location.replace(destination.href);
}
