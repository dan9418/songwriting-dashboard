import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

export function EntityIndexLayout({
  icon,
  title,
  subtitle,
  actionHref,
  actionLabel,
  children
}: {
  icon: AppIconName;
  title: string;
  subtitle: string;
  actionHref: string;
  actionLabel: string;
  children?: ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <AppIcon name={icon} className="mt-0.5 h-8 w-8 text-[color:var(--ink)]" />
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-[color:var(--muted)]">{subtitle}</p>
          </div>
        </div>
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]"
        >
          <AppIcon name="plus" className="h-4 w-4" />
          {actionLabel}
        </Link>
      </div>

      {children ? <div className="border-t border-[#efe3d3] p-4">{children}</div> : null}
    </section>
  );
}
