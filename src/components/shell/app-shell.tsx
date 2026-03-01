"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/archive", label: "Archive" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/search", label: "Search" },
  { href: "/account", label: "Account" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-3 pb-8 pt-4 md:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="panel p-4 md:sticky md:top-4 md:h-fit">
          <h1 className="text-xl font-semibold">Songwriting Atlas</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Local-first metadata studio</p>
          <nav className="mt-4 grid gap-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[color:var(--accent)] text-white"
                      : "bg-[color:var(--surface)] text-[color:var(--ink)] hover:bg-[#f3e8d7]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="fade-up">{children}</main>
      </div>
    </div>
  );
}

