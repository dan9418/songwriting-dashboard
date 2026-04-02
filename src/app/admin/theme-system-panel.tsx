"use client";

import { AppIcon } from "@/components/ui/app-icons";
import { ActionButton } from "@/components/ui/action-button";
import { THEME_ELEMENT_SUMMARY } from "@/lib/theme/design-system";
import { useTheme } from "@/components/theme/theme-provider";

const SWATCH_KEYS = [
  "bg",
  "surface",
  "accent",
  "iconBg",
  "tableHeader",
  "danger"
] as const;

export function ThemeSystemPanel() {
  const { theme, randomizeTheme } = useTheme();

  return (
    <section className="panel grid gap-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="theme-icon-frame h-12 w-12 shrink-0">
            <AppIcon name="admin" className="h-6 w-6" />
          </span>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">Theme System</h2>
              <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--icon-color)]">
                {theme.label}
              </span>
            </div>
            <p className="max-w-2xl text-sm text-[color:var(--muted)]">
              {theme.description} The palette is centralized and applied through shared tokens for backgrounds, cards,
              headings, icons, buttons, and table surfaces.
            </p>
          </div>
        </div>

        <ActionButton onClick={randomizeTheme}>Randomize Theme</ActionButton>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.9fr)]">
        <div className="overflow-x-auto">
          <table className="theme-table text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide">
                <th className="px-3 py-2 font-semibold">Element</th>
                <th className="px-3 py-2 font-semibold">Usage</th>
                <th className="px-3 py-2 font-semibold">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {THEME_ELEMENT_SUMMARY.map((entry) => (
                <tr key={entry.element}>
                  <td className="px-3 py-3 font-medium text-[color:var(--ink)]">{entry.element}</td>
                  <td className="px-3 py-3 text-[color:var(--muted)]">{entry.usage}</td>
                  <td className="px-3 py-3 text-xs text-[color:var(--muted)]">
                    {entry.tokens.map((token) => `--${token}`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="theme-card grid gap-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Live Palette</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SWATCH_KEYS.map((token) => (
                <div key={token} className="grid gap-2 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--bg-panel)] p-2">
                  <div
                    className="h-10 rounded-lg border border-[color:var(--border-soft)]"
                    style={{ backgroundColor: theme.tokens[token] }}
                  />
                  <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted)]">{token}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--bg-panel)] p-3">
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Preview</p>
            <div className="flex items-center gap-3">
              <span className="theme-icon-frame h-10 w-10">
                <AppIcon name="track" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Shared UI primitives</h3>
                <p className="text-sm text-[color:var(--muted)]">Theme-aware cards, buttons, and icons.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton>Primary</ActionButton>
              <ActionButton tone="ghost">Ghost</ActionButton>
              <ActionButton tone="danger">Danger</ActionButton>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
