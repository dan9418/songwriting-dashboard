"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

const PRIMARY_NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/notebook", label: "Notebook", icon: "notebook" },
  { href: "/artists", label: "Artists", icon: "artist" },
  { href: "/projects", label: "Projects", icon: "project" },
  { href: "/tracks", label: "Tracks", icon: "track" },
  { href: "/admin", label: "Admin", icon: "admin" }
] satisfies Array<{ href: string; label: string; icon: AppIconName }>;

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
    <div className="min-h-screen pb-8">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[color:var(--border-soft)] bg-[color:var(--bg-panel)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl px-3 md:px-6">
          <nav className="flex min-w-0 flex-1 overflow-x-auto" aria-label="Primary">
            <div className="flex min-w-max items-end gap-1">
              {PRIMARY_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition ${
                    isActive(item.href)
                      ? "border-[color:var(--accent)] text-[color:var(--accent)]"
                      : "border-transparent text-[color:var(--muted)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--ink)]"
                  }`}
                >
                  <AppIcon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 pt-20 md:px-6 md:pt-24">
        <main className="fade-up">{children}</main>
      </div>
    </div>
  );
}
