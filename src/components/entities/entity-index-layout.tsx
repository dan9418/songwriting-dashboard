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
          <span className="theme-icon-frame mt-0.5 h-12 w-12 shrink-0">
            <AppIcon name={icon} className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-[color:var(--muted)]">{subtitle}</p>
          </div>
        </div>
        <Link href={actionHref} className="theme-button-link theme-button-link--primary">
          <AppIcon name="plus" className="h-4 w-4" />
          {actionLabel}
        </Link>
      </div>

      {children ? <div className="border-t border-[color:var(--border-soft)] p-4">{children}</div> : null}
    </section>
  );
}
