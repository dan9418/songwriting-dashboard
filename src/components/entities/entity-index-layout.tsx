import Link from "next/link";
import type { ReactNode } from "react";

export function EntityIndexLayout({
  title,
  subtitle,
  actionHref,
  actionLabel,
  children
}: {
  title: string;
  subtitle: string;
  actionHref: string;
  actionLabel: string;
  children?: ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-[color:var(--muted)]">{subtitle}</p>
        </div>
        <Link
          href={actionHref}
          className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]"
        >
          {actionLabel}
        </Link>
      </div>

      {children ? <div className="border-t border-[#efe3d3] p-4">{children}</div> : null}
    </section>
  );
}
