"use client";

import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { useEffect, type ReactNode } from "react";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getThemeById } from "@/lib/theme/design-system";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body"
});

function ThemeSelectionBridge({
  children,
  themeId
}: {
  children: ReactNode;
  themeId: string;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(themeId);
  }, [setTheme, themeId]);

  return <>{children}</>;
}

export function StorybookProviders({
  children,
  themeId
}: {
  children: ReactNode;
  themeId: string;
}) {
  const selectedThemeId = getThemeById(themeId).id;

  return (
    <ThemeProvider>
      <ThemeSelectionBridge themeId={selectedThemeId}>
        <ToastProvider>
          <div className={`${headingFont.variable} ${bodyFont.variable} min-h-screen p-6`}>
            {children}
          </div>
        </ToastProvider>
      </ThemeSelectionBridge>
    </ThemeProvider>
  );
}
