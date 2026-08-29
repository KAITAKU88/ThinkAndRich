import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Be_Vietnam_Pro } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const fontSerif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const fontSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Think & Rich — Thư viện Mô hình Tư duy & Chiến lược Kinh doanh",
  description:
    "Kho tàng tổng hợp và đúc kết toàn bộ các Mô hình Tư duy, Mô hình Tâm trí và Chiến lược Kinh doanh đỉnh cao, khai phóng nhận thức và nâng tầm quyết định.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Step 3 — Serif headings + Sans body for public Neo-Brutalist shell. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${fontSerif.variable} ${fontSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
