import type { CSSProperties } from "react";
import { ActionButton } from "@/components/ui/action-button";
import {
  getThemeById,
  themeToCssVariables,
  type AppTheme,
  type ThemeTokens
} from "@/lib/theme/design-system";

const DEFAULT_THEME_ORDER = [
  "brass-bone",
  "harbor-ink",
  "olive-paper",
  "cobalt-punch",
  "sea-glass",
  "rose-radio"
] as const;

const PALETTE_PREVIEW_COPY = {
  "brass-bone": {
    tag: "Warm",
    title: "Studio sessions",
    copy: "Editorial warmth with enough contrast for controls."
  },
  "harbor-ink": {
    tag: "Cool",
    title: "Session overview",
    copy: "Clean, crisp, and easy to trust in admin surfaces."
  },
  "olive-paper": {
    tag: "Vintage",
    title: "Catalog view",
    copy: "Calm, practical, and slightly archival."
  },
  "cobalt-punch": {
    tag: "Bold",
    title: "Activity stream",
    copy: "The most assertive option if you want a more modern feel."
  },
  "sea-glass": {
    tag: "Calm",
    title: "Project notes",
    copy: "Relaxed but still distinctly product-like."
  },
  "rose-radio": {
    tag: "Expressive",
    title: "Recent sessions",
    copy: "The most expressive option if you want the app to feel memorable fast."
  }
} satisfies Record<
  AppTheme["id"],
  {
    tag: string;
    title: string;
    copy: string;
  }
>;

type PalettePreviewThemeId = keyof typeof PALETTE_PREVIEW_COPY;

const SWATCHES = [
  { label: "bg", token: "bg" },
  { label: "surface", token: "bgPanel" },
  { label: "accent", token: "accent" },
  { label: "iconBg", token: "iconBg" },
  { label: "tableHeader", token: "tableHeader" },
  { label: "danger", token: "danger" }
] satisfies Array<{
  label: string;
  token: keyof Pick<ThemeTokens, "bg" | "bgPanel" | "accent" | "iconBg" | "tableHeader" | "danger">;
}>;

export interface ThemePalettePreviewProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  themes?: AppTheme[];
}

export function ThemePalettePreview({
  eyebrow = "Songwriting Dashboard",
  title = "Theme Palette Preview",
  description = "Preview for the six palettes kept for the app. Each card shows the same key colors your in-app theme panel emphasizes: background, surface, accent, icon, table, and danger.",
  themes = DEFAULT_THEME_ORDER.map((themeId) => getThemeById(themeId))
}: ThemePalettePreviewProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 text-[color:var(--page-ink,#201A17)] sm:px-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
      <div className="mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--page-muted,#655B56)]">
          {eyebrow}
        </p>
        <h1 className="mb-3 text-[clamp(2rem,6vw,3.5rem)] leading-[0.95]">{title}</h1>
        <p className="max-w-3xl text-base leading-7 text-[color:var(--page-muted,#655B56)]">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {themes.map((theme) => (
          <ThemePaletteCard key={theme.id} theme={theme} />
        ))}
      </div>
    </section>
  );
}

function ThemePaletteCard({ theme }: { theme: AppTheme }) {
  const preview = PALETTE_PREVIEW_COPY[theme.id as PalettePreviewThemeId];
  const themeStyles = themeToCssVariables(theme) as CSSProperties;
  const cardStyle = {
    ...themeStyles,
    boxShadow: "0 18px 40px rgba(var(--shadow-color), 0.14)"
  } satisfies CSSProperties;
  const headerStyle = {
    background: [
      "radial-gradient(circle at top left, color-mix(in srgb, var(--accent-soft) 72%, white 28%) 0%, transparent 36%)",
      "linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%)"
    ].join(", ")
  } satisfies CSSProperties;
  const previewStyle = {
    background: "color-mix(in srgb, var(--bg-panel) 74%, white 26%)",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.4)"
  } satisfies CSSProperties;
  const swatchCardStyle = {
    background: "color-mix(in srgb, var(--bg-panel) 78%, white 22%)"
  } satisfies CSSProperties;

  return (
    <article
      className="overflow-hidden rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--bg-panel)]"
      style={cardStyle}
    >
      <div className="border-b border-[color:var(--border-soft)] p-6 md:p-7" style={headerStyle}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-2xl leading-none text-[color:var(--ink)]">{theme.label}</h2>
            <p className="mt-3 max-w-[26ch] text-sm leading-6 text-[color:var(--muted)]">
              {theme.description}
            </p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-[color:var(--accent-soft)] px-[10px] py-[7px] text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--icon-color)]">
            {preview.tag}
          </span>
        </div>

        <div
          className="mt-6 grid gap-4 rounded-[18px] border border-[color:var(--border-soft)] p-5"
          style={previewStyle}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-[42px] w-[42px] place-items-center rounded-[14px] bg-[color:var(--icon-bg)] text-lg font-bold text-[color:var(--icon-color)] shadow-[inset_0_0_0_1px_rgba(var(--shadow-color),0.08)]">
              {theme.label.charAt(0)}
            </div>
            <div>
              <p className="m-0 text-base font-bold leading-5 text-[color:var(--ink)]">{preview.title}</p>
              <p className="mt-1 text-[13px] leading-5 text-[color:var(--muted)]">{preview.copy}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton type="button">Primary</ActionButton>
            <ActionButton type="button" tone="ghost">
              Ghost
            </ActionButton>
            <ActionButton type="button" tone="danger">
              Danger
            </ActionButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-[color:var(--surface)] p-5 md:p-6 max-[640px]:grid-cols-2">
        {SWATCHES.map((swatch) => (
          <div
            key={swatch.label}
            className="grid gap-2 rounded-2xl border border-[color:var(--border-soft)] p-3"
            style={swatchCardStyle}
          >
            <div
              className="h-11 rounded-xl border border-[color:var(--border-strong)]"
              style={{ backgroundColor: theme.tokens[swatch.token] }}
            />
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
              {swatch.label}
            </div>
            <div className="font-mono text-xs font-semibold leading-4 text-[color:var(--ink)]">
              {theme.tokens[swatch.token]}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
