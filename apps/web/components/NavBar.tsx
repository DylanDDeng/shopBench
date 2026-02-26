"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">ShopBench</Link>
      <Link href="/" className={pathname === "/" ? "active" : undefined}>Leaderboard</Link>
      <Link href="/compare" className={pathname === "/compare" ? "active" : undefined}>Compare</Link>
      <Link href="/insights" className={pathname === "/insights" ? "active" : undefined}>Insights</Link>
      <Link href="/about" className={pathname === "/about" ? "active" : undefined}>About</Link>
    </nav>
  );
}
