"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  APP_THEMES,
  DEFAULT_THEME_ID,
  getRandomThemeId,
  getThemeById,
  isThemeId,
  themeToCssVariables,
  type AppTheme
} from "@/lib/theme/design-system";

const THEME_STORAGE_KEY = "songwriting-dashboard.theme";

interface ThemeContextValue {
  theme: AppTheme;
  themes: AppTheme[];
  setTheme: (themeId: string) => void;
  randomizeTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    const storedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedThemeId && isThemeId(storedThemeId)) {
      setThemeId(storedThemeId);
    }
  }, []);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    const variables = themeToCssVariables(theme);

    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value);
    }

    root.dataset.theme = theme.id;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themes: APP_THEMES,
      setTheme: (nextThemeId) => setThemeId(getThemeById(nextThemeId).id),
      randomizeTheme: () => setThemeId((currentThemeId) => getRandomThemeId(currentThemeId))
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
