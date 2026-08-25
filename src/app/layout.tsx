import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

// `latin` alone leaves out every Vietnamese letter that carries a tone mark
// (ế, ộ, ằ, ữ — U+1EA0–1EF9), which is most of the site's own language, so
// those glyphs would fall back to a system face mid-word. Cyrillic and Greek
// come along for the Russian UI.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext", "vietnamese", "cyrillic", "greek"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext", "vietnamese"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext", "vietnamese", "cyrillic", "greek"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Think & Rich — Thư viện Mô hình Tư duy & Chiến lược Kinh doanh",
  description:
    "Kho tàng tổng hợp và đúc kết toàn bộ các Mô hình Tư duy, Mô hình Tâm trí và Chiến lược Kinh doanh đỉnh cao, khai phóng nhận thức và nâng tầm quyết định.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The font variables belong on <html>, not <body>: Tailwind v4 emits its
    // @theme block onto :root, so a theme value written as
    // `--font-sans: var(--font-plex-sans), …` is resolved there. Declared one
    // level lower, --font-plex-sans is undefined at that point, the whole
    // declaration is invalid, and every face silently falls back to a system
    // font — which is what had been happening on every page.
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${plexSans.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

