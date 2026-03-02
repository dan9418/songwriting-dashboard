"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const PRIMARY_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/archive", label: "Archive" },
  { href: "/sandbox", label: "Sandbox" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === "/";

  function isActive(href: string) {
    if (href === "/") {
      return isRoot;
    }
    return pathname?.startsWith(href);
  }

  return (
    <div className="min-h-screen px-3 pb-8 pt-4 md:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <header className="panel sticky top-4 z-30 flex items-center justify-between gap-3 px-3 py-2">
          <div className="flex items-center gap-2 md:gap-3">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  isActive(item.href)
                    ? "bg-[color:var(--accent)] text-white"
                    : "bg-[color:var(--surface)] text-[color:var(--ink)] hover:bg-[#f3e8d7]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className={`rounded-lg p-2 transition ${
                pathname?.startsWith("/search")
                  ? "bg-[color:var(--accent)] text-white"
                  : "bg-[color:var(--surface)] text-[color:var(--ink)] hover:bg-[#f3e8d7]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className={`rounded-lg p-2 transition ${
                pathname?.startsWith("/account")
                  ? "bg-[color:var(--accent)] text-white"
                  : "bg-[color:var(--surface)] text-[color:var(--ink)] hover:bg-[#f3e8d7]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.8-3.2 4.5-5 8-5s6.2 1.8 8 5" />
              </svg>
            </Link>
          </div>
        </header>
        <main className="fade-up">{children}</main>
      </div>
    </div>
  );
}
