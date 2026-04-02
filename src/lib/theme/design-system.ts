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
    id: "harbor-ink",
    label: "Harbor Ink",
    description: "Balanced coastal blue-greens with crisp, trustworthy contrast.",
    tokens: {
      bg: "#E8EFF2",
      bgPanel: "#F8FCFD",
      surface: "#EDF4F6",
      surfaceMuted: "#F3F8F9",
      ink: "#1B2A2F",
      muted: "#5E7176",
      accent: "#0B7285",
      accentHover: "#095E6E",
      accentSoft: "#CBE7EA",
      accentContrast: "#F7FEFF",
      borderSoft: "#D1E1E5",
      borderStrong: "#B6CCD3",
      buttonGhostBg: "#DCECEF",
      buttonGhostHover: "#CFE3E7",
      buttonGhostText: "#1B2A2F",
      iconBg: "#CBE7EA",
      iconColor: "#0C5B69",
      tableHeader: "#EAF3F5",
      tableRow: "#F8FCFD",
      tableDetailBg: "#E3EFF2",
      inputBg: "#ffffff",
      focusRing: "#59AFC0",
      gradientStart: "#C6D9E4",
      gradientMid: "#E8EFF2",
      gradientEnd: "#D9E8E2",
      shadowColor: "21 59 69",
      danger: "#C44536",
      dangerHover: "#A8382B"
    }
  },
  {
    id: "brass-bone",
    label: "Brass & Bone",
    description: "Warm, analog neutrals with a brass-forward action color.",
    tokens: {
      bg: "#F5EFE6",
      bgPanel: "#FFF9F0",
      surface: "#F7EFE4",
      surfaceMuted: "#FBF4EA",
      ink: "#2C2118",
      muted: "#746357",
      accent: "#B7792B",
      accentHover: "#9D6420",
      accentSoft: "#F1D9B8",
      accentContrast: "#FFF8F0",
      borderSoft: "#E5D5C3",
      borderStrong: "#D5BDA4",
      buttonGhostBg: "#EFDDC9",
      buttonGhostHover: "#E7D0B7",
      buttonGhostText: "#2C2118",
      iconBg: "#F1D9B8",
      iconColor: "#8D5A17",
      tableHeader: "#F7EAD7",
      tableRow: "#FFF9F0",
      tableDetailBg: "#F4E4D0",
      inputBg: "#ffffff",
      focusRing: "#D3A15B",
      gradientStart: "#E8CFB0",
      gradientMid: "#F5EFE6",
      gradientEnd: "#E6DBC9",
      shadowColor: "77 48 17",
      danger: "#B53A2C",
      dangerHover: "#982E22"
    }
  },
  {
    id: "olive-paper",
    label: "Olive Paper",
    description: "Quiet vintage utility with olive accents and archival warmth.",
    tokens: {
      bg: "#F2F1E7",
      bgPanel: "#FBFBF6",
      surface: "#F0F1E5",
      surfaceMuted: "#F6F6EE",
      ink: "#28301A",
      muted: "#697157",
      accent: "#6B7B30",
      accentHover: "#596726",
      accentSoft: "#DEE5C1",
      accentContrast: "#FCFEEF",
      borderSoft: "#DADDCB",
      borderStrong: "#C3C8AB",
      buttonGhostBg: "#E8EBCD",
      buttonGhostHover: "#DCE2BB",
      buttonGhostText: "#28301A",
      iconBg: "#DEE5C1",
      iconColor: "#546122",
      tableHeader: "#EEF0E3",
      tableRow: "#FBFBF6",
      tableDetailBg: "#E7E8D8",
      inputBg: "#ffffff",
      focusRing: "#9FAE63",
      gradientStart: "#D7DCAF",
      gradientMid: "#F2F1E7",
      gradientEnd: "#E6DDCD",
      shadowColor: "50 60 22",
      danger: "#B14B39",
      dangerHover: "#964032"
    }
  },
  {
    id: "cobalt-punch",
    label: "Cobalt Punch",
    description: "Sharper modern blues with high-energy accents and clean contrast.",
    tokens: {
      bg: "#EDF1FB",
      bgPanel: "#F9FBFF",
      surface: "#EEF3FF",
      surfaceMuted: "#F5F7FF",
      ink: "#18244D",
      muted: "#5C698A",
      accent: "#2B56D9",
      accentHover: "#2146B8",
      accentSoft: "#D7E1FF",
      accentContrast: "#F8FBFF",
      borderSoft: "#D5DEF6",
      borderStrong: "#B9C9EE",
      buttonGhostBg: "#E4EAFF",
      buttonGhostHover: "#D7E0FF",
      buttonGhostText: "#18244D",
      iconBg: "#D7E1FF",
      iconColor: "#2744A8",
      tableHeader: "#EEF3FF",
      tableRow: "#F9FBFF",
      tableDetailBg: "#E5ECFF",
      inputBg: "#ffffff",
      focusRing: "#7B98F5",
      gradientStart: "#CDD6FF",
      gradientMid: "#EDF1FB",
      gradientEnd: "#DCE8FF",
      shadowColor: "28 54 136",
      danger: "#C93030",
      dangerHover: "#A82727"
    }
  },
  {
    id: "sea-glass",
    label: "Sea Glass",
    description: "Soft mineral greens with clean studio calm and plenty of breathing room.",
    tokens: {
      bg: "#EAF5F3",
      bgPanel: "#F8FDFC",
      surface: "#EAF4F2",
      surfaceMuted: "#F2F8F7",
      ink: "#17342E",
      muted: "#60766F",
      accent: "#2F8C7B",
      accentHover: "#256F62",
      accentSoft: "#C7E8E0",
      accentContrast: "#F7FEFC",
      borderSoft: "#CEE2DE",
      borderStrong: "#B0CCC5",
      buttonGhostBg: "#D9F0EB",
      buttonGhostHover: "#CBE6DF",
      buttonGhostText: "#17342E",
      iconBg: "#C7E8E0",
      iconColor: "#256D60",
      tableHeader: "#E8F3F1",
      tableRow: "#F8FDFC",
      tableDetailBg: "#E0EEEB",
      inputBg: "#ffffff",
      focusRing: "#70B9AA",
      gradientStart: "#BEE1D9",
      gradientMid: "#EAF5F3",
      gradientEnd: "#D5EBF3",
      shadowColor: "31 79 69",
      danger: "#BF4038",
      dangerHover: "#A43730"
    }
  },
  {
    id: "rose-radio",
    label: "Rose Radio",
    description: "Expressive pink-red accents balanced with soft, grown-up neutrals.",
    tokens: {
      bg: "#FAF0F2",
      bgPanel: "#FFF8F9",
      surface: "#F8EBEF",
      surfaceMuted: "#FCF4F6",
      ink: "#341D25",
      muted: "#7A5D67",
      accent: "#D14F73",
      accentHover: "#B53D60",
      accentSoft: "#F5CDD9",
      accentContrast: "#FFF8FB",
      borderSoft: "#E8D3D9",
      borderStrong: "#D8B7C1",
      buttonGhostBg: "#F4DDE4",
      buttonGhostHover: "#EECFD9",
      buttonGhostText: "#341D25",
      iconBg: "#F5CDD9",
      iconColor: "#A53B5B",
      tableHeader: "#F7E7EC",
      tableRow: "#FFF8F9",
      tableDetailBg: "#F3DDE4",
      inputBg: "#ffffff",
      focusRing: "#EA83A0",
      gradientStart: "#F6C2D0",
      gradientMid: "#FAF0F2",
      gradientEnd: "#F1DBCF",
      shadowColor: "92 35 59",
      danger: "#AF3043",
      dangerHover: "#95273A"
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
