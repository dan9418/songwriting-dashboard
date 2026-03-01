import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Songwriting Dashboard",
  description: "Local-first songwriter metadata manager"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
