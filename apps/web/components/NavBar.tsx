"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getLocaleFromPathname, getLocaleSwitchPath, NAV_TEXT, stripLocalePrefix } from "@/lib/i18n";

export function NavBar() {
  const pathname = usePathname() ?? "/";
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
      <div className="nav-right" aria-label={text.language}>
        <Link
          href={getLocaleSwitchPath(pathname, "en")}
          className={`lang-btn ${locale === "en" ? "active" : ""}`}
        >
          EN
        </Link>
        <Link
          href={getLocaleSwitchPath(pathname, "zh")}
          className={`lang-btn ${locale === "zh" ? "active" : ""}`}
        >
          中文
        </Link>
      </div>
    </nav>
  );
}
