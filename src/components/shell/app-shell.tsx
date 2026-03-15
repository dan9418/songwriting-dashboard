"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

const PRIMARY_NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
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
    <div className="min-h-screen px-3 pb-8 pt-4 md:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <header className="panel sticky top-4 z-30 flex items-center justify-between gap-3 px-3 py-2">
          <div className="flex items-center gap-2 md:gap-3">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive(item.href)
                    ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                    : "bg-[color:var(--surface)] text-[color:var(--ink)] hover:bg-[color:var(--button-ghost-hover)]"
                }`}
              >
                <AppIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="fade-up">{children}</main>
      </div>
    </div>
  );
}
