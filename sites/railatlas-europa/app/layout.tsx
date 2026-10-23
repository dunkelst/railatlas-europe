import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RailAtlas Europa · Deine Reise auf Schienen",
  description: "Europäischer Bahnatlas. Bahnhöfe finden und Reisen mit Bahn und ÖPNV über Zwischenziele planen.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head><link rel="stylesheet" href="/vendor/leaflet.css"/><meta name="robots" content="noindex"/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
