"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@/components/ui/action-button";

export function ModalShell({
  title,
  description,
  headerLeading,
  children,
  footer,
  onClose
}: {
  title: string;
  description?: string;
  headerLeading?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="panel max-h-[calc(100vh-4rem)] w-full max-w-4xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border-soft)] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {headerLeading ? <div className="mt-1 shrink-0 text-[color:var(--ink)]">{headerLeading}</div> : null}
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold">{title}</h2>
              {description ? <p className="mt-2 text-sm text-[color:var(--muted)]">{description}</p> : null}
            </div>
          </div>
          <ActionButton tone="ghost" onClick={onClose}>
            Close
          </ActionButton>
        </div>
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-[color:var(--border-soft)] px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
