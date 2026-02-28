export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return first === "zh" ? "zh" : "en";
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function getLocaleSwitchPath(pathname: string, targetLocale: Locale): string {
  const basePath = stripLocalePrefix(pathname);
  return basePath === "/" ? `/${targetLocale}` : `/${targetLocale}${basePath}`;
}

export const NAV_TEXT: Record<Locale, {
  brand: string;
  leaderboard: string;
  insights: string;
  about: string;
  language: string;
}> = {
  en: {
    brand: "ShopBench",
    leaderboard: "Leaderboard",
    insights: "Insights",
    about: "About",
    language: "Language",
  },
  zh: {
    brand: "ShopBench",
    leaderboard: "排行榜",
    insights: "洞察",
    about: "关于",
    language: "语言",
  },
};
