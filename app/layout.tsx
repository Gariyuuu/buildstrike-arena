import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildStrike Arena — 1v1 Build & Shoot",
  description:
    "BuildStrike Arena is a fast browser-based 1v1 build-and-shoot game. Duel a bot or a friend in a compact arena with rifles, shotguns, and on-the-fly building.",
  applicationName: "BuildStrike Arena",
  keywords: ["BuildStrike Arena", "browser game", "1v1 shooter", "building game", "three.js game"],
  openGraph: {
    title: "BuildStrike Arena — 1v1 Build & Shoot",
    description: "Duel a bot or a friend in a fast, compact browser arena. Shoot, build, heal, win.",
    type: "website",
    siteName: "BuildStrike Arena",
  },
  twitter: {
    card: "summary",
    title: "BuildStrike Arena — 1v1 Build & Shoot",
    description: "Duel a bot or a friend in a fast, compact browser arena. Shoot, build, heal, win.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full min-h-full overflow-hidden bg-bs-navy-950 text-white">{children}</body>
    </html>
  );
}
