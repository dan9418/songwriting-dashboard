"use client";

import type { ButtonHTMLAttributes } from "react";

export type ActionButtonTone = "primary" | "ghost" | "danger";

export function ActionButton({
  children,
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ActionButtonTone;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-hover)]"
      : tone === "danger"
        ? "bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger-hover)]"
        : "bg-[color:var(--button-ghost-bg)] text-[color:var(--button-ghost-text)] hover:bg-[color:var(--button-ghost-hover)]";

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
