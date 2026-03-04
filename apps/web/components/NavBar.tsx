"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getLocaleFromPathname, getLocaleSwitchPath, NAV_TEXT, stripLocalePrefix, type Locale } from "@/lib/i18n";

export function NavBar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname);
  const text = NAV_TEXT[locale];
  const normalizedPath = stripLocalePrefix(pathname);

  const localeHref = (path: "/" | "/insights" | "/about") => {
    if (path === "/") return `/${locale}`;
    return `/${locale}${path}`;
  };

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link href={localeHref("/")} className="nav-brand">{text.brand}</Link>
        <Link href={localeHref("/")} className={normalizedPath === "/" ? "active" : undefined}>{text.leaderboard}</Link>
        <Link href={localeHref("/insights")} className={normalizedPath === "/insights" ? "active" : undefined}>{text.insights}</Link>
        <Link href={localeHref("/about")} className={normalizedPath === "/about" ? "active" : undefined}>{text.about}</Link>
      </div>
      <div className="nav-right">
        <div className="nav-language-picker" aria-label={text.language}>
          <span className="nav-language-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18" />
              <path d="M12 3a14 14 0 0 0 0 18" />
            </svg>
          </span>
          <select
            className="nav-language-select"
            value={locale}
            onChange={(e) => {
              const nextLocale = e.target.value as Locale;
              if (nextLocale === locale) return;
              router.push(getLocaleSwitchPath(pathname, nextLocale));
            }}
            aria-label={text.language}
          >
            <option value="en">EN</option>
            <option value="zh">中文</option>
          </select>
          <span className="nav-language-caret" aria-hidden="true">
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </span>
        </div>
      </div>
    </nav>
  );
}
