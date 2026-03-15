export interface ThemeTokens {
  bg: string;
  bgPanel: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  muted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentContrast: string;
  borderSoft: string;
  borderStrong: string;
  buttonGhostBg: string;
  buttonGhostHover: string;
  buttonGhostText: string;
  iconBg: string;
  iconColor: string;
  tableHeader: string;
  tableRow: string;
  tableDetailBg: string;
  inputBg: string;
  focusRing: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  shadowColor: string;
  danger: string;
  dangerHover: string;
}

export interface AppTheme {
  id: string;
  label: string;
  description: string;
  tokens: ThemeTokens;
}

export const THEME_ELEMENT_SUMMARY = [
  {
    element: "Backgrounds",
    usage: "Canvas gradients and page wash",
    tokens: ["bg", "gradientStart", "gradientMid", "gradientEnd"]
  },
  {
    element: "Cards",
    usage: "Panels, shells, and surfaced content blocks",
    tokens: ["bgPanel", "surface", "borderSoft", "shadowColor"]
  },
  {
    element: "Headings",
    usage: "Primary titles and high-emphasis labels",
    tokens: ["ink", "muted"]
  },
  {
    element: "Icons",
    usage: "Icon chips and accented graphic moments",
    tokens: ["iconBg", "iconColor", "accentSoft"]
  },
  {
    element: "Buttons",
    usage: "Primary actions, ghost actions, and destructive actions",
    tokens: ["accent", "accentHover", "accentContrast", "buttonGhostBg", "buttonGhostHover", "danger"]
  },
  {
    element: "Tables",
    usage: "Header rows, body dividers, and detail previews",
    tokens: ["tableHeader", "tableRow", "tableDetailBg", "borderStrong"]
  }
] as const;

export const APP_THEMES = [
  {
    id: "atlas",
    label: "Atlas",
    description: "Cool editorial blues with a soft mint wash.",
    tokens: {
      bg: "#eef2f7",
      bgPanel: "#f8fbff",
      surface: "#eaf0f9",
      surfaceMuted: "#f3f7fc",
      ink: "#1d2634",
      muted: "#5f6d83",
      accent: "#4f6db8",
      accentHover: "#3d5ca4",
      accentSoft: "#d8e3ff",
      accentContrast: "#f8fbff",
      borderSoft: "#d6e0ee",
      borderStrong: "#c1cede",
      buttonGhostBg: "#e5edf8",
      buttonGhostHover: "#d7e2f2",
      buttonGhostText: "#1d2634",
      iconBg: "#d8e3ff",
      iconColor: "#39558f",
      tableHeader: "#f1f5fb",
      tableRow: "#f8fbff",
      tableDetailBg: "#edf3fb",
      inputBg: "#ffffff",
      focusRing: "#8ba8e8",
      gradientStart: "#ddd9f6",
      gradientMid: "#e6f0ff",
      gradientEnd: "#dff2ea",
      shadowColor: "31 48 78",
      danger: "#b91c1c",
      dangerHover: "#991b1b"
    }
  },
  {
    id: "ember",
    label: "Ember",
    description: "Warm parchment neutrals with a copper action color.",
    tokens: {
      bg: "#f6efe6",
      bgPanel: "#fff9f3",
      surface: "#f6eadf",
      surfaceMuted: "#fbf3ea",
      ink: "#30211a",
      muted: "#7b6257",
      accent: "#bb6b3b",
      accentHover: "#9f562b",
      accentSoft: "#f2d4bf",
      accentContrast: "#fffaf5",
      borderSoft: "#e8d5c5",
      borderStrong: "#d9bda6",
      buttonGhostBg: "#f0dfd0",
      buttonGhostHover: "#e6d1bf",
      buttonGhostText: "#30211a",
      iconBg: "#f2d4bf",
      iconColor: "#8c4921",
      tableHeader: "#fbf1e7",
      tableRow: "#fff9f3",
      tableDetailBg: "#f5e5d7",
      inputBg: "#ffffff",
      focusRing: "#d79b70",
      gradientStart: "#fde4cb",
      gradientMid: "#f9efe4",
      gradientEnd: "#f6e4d5",
      shadowColor: "74 42 20",
      danger: "#b33a2e",
      dangerHover: "#972d23"
    }
  },
  {
    id: "grove",
    label: "Grove",
    description: "Muted forest greens balanced with sage surfaces.",
    tokens: {
      bg: "#edf4ef",
      bgPanel: "#f9fdf9",
      surface: "#e4efe8",
      surfaceMuted: "#f1f7f3",
      ink: "#1d2d24",
      muted: "#557166",
      accent: "#3d7d62",
      accentHover: "#31684f",
      accentSoft: "#cfe6d9",
      accentContrast: "#f7fcf8",
      borderSoft: "#d1e1d7",
      borderStrong: "#afc7b8",
      buttonGhostBg: "#dbeadf",
      buttonGhostHover: "#cde0d4",
      buttonGhostText: "#1d2d24",
      iconBg: "#cfe6d9",
      iconColor: "#285743",
      tableHeader: "#eef5f0",
      tableRow: "#f9fdf9",
      tableDetailBg: "#e6f0ea",
      inputBg: "#ffffff",
      focusRing: "#7fb396",
      gradientStart: "#d4eadf",
      gradientMid: "#e8f4ec",
      gradientEnd: "#e3efe3",
      shadowColor: "25 49 37",
      danger: "#b54040",
      dangerHover: "#973434"
    }
  },
  {
    id: "signal",
    label: "Signal",
    description: "Slate surfaces with coral accents for stronger contrast.",
    tokens: {
      bg: "#eef1f4",
      bgPanel: "#f9fbfd",
      surface: "#e7ecf1",
      surfaceMuted: "#f2f5f8",
      ink: "#1f2937",
      muted: "#64748b",
      accent: "#d26451",
      accentHover: "#b85242",
      accentSoft: "#f4d4cf",
      accentContrast: "#fff8f6",
      borderSoft: "#d6dde5",
      borderStrong: "#bcc8d4",
      buttonGhostBg: "#e2e8ef",
      buttonGhostHover: "#d4dde6",
      buttonGhostText: "#1f2937",
      iconBg: "#f4d4cf",
      iconColor: "#9f4336",
      tableHeader: "#f1f4f7",
      tableRow: "#f9fbfd",
      tableDetailBg: "#ebeef2",
      inputBg: "#ffffff",
      focusRing: "#ed998c",
      gradientStart: "#e7d9e7",
      gradientMid: "#edf1f7",
      gradientEnd: "#dde9e5",
      shadowColor: "36 48 64",
      danger: "#b42318",
      dangerHover: "#951e14"
    }
  }
] satisfies AppTheme[];

export const DEFAULT_THEME_ID = APP_THEMES[0].id;

const themeIndex = new Map(APP_THEMES.map((theme) => [theme.id, theme]));

export function isThemeId(value: string): value is AppTheme["id"] {
  return themeIndex.has(value);
}

export function getThemeById(themeId?: string | null) {
  if (themeId && themeIndex.has(themeId)) {
    return themeIndex.get(themeId)!;
  }

  return APP_THEMES[0];
}

export function getRandomThemeId(currentThemeId?: string) {
  const candidates = APP_THEMES.filter((theme) => theme.id !== currentThemeId);
  const source = candidates.length > 0 ? candidates : APP_THEMES;
  return source[Math.floor(Math.random() * source.length)]!.id;
}

export function themeToCssVariables(theme: AppTheme) {
  return {
    "--bg": theme.tokens.bg,
    "--bg-panel": theme.tokens.bgPanel,
    "--surface": theme.tokens.surface,
    "--surface-muted": theme.tokens.surfaceMuted,
    "--ink": theme.tokens.ink,
    "--muted": theme.tokens.muted,
    "--accent": theme.tokens.accent,
    "--accent-hover": theme.tokens.accentHover,
    "--accent-soft": theme.tokens.accentSoft,
    "--accent-contrast": theme.tokens.accentContrast,
    "--border-soft": theme.tokens.borderSoft,
    "--border-strong": theme.tokens.borderStrong,
    "--button-ghost-bg": theme.tokens.buttonGhostBg,
    "--button-ghost-hover": theme.tokens.buttonGhostHover,
    "--button-ghost-text": theme.tokens.buttonGhostText,
    "--icon-bg": theme.tokens.iconBg,
    "--icon-color": theme.tokens.iconColor,
    "--table-header": theme.tokens.tableHeader,
    "--table-row": theme.tokens.tableRow,
    "--table-detail-bg": theme.tokens.tableDetailBg,
    "--input-bg": theme.tokens.inputBg,
    "--focus-ring": theme.tokens.focusRing,
    "--gradient-start": theme.tokens.gradientStart,
    "--gradient-mid": theme.tokens.gradientMid,
    "--gradient-end": theme.tokens.gradientEnd,
    "--shadow-color": theme.tokens.shadowColor,
    "--danger": theme.tokens.danger,
    "--danger-hover": theme.tokens.dangerHover
  } satisfies Record<string, string>;
}
