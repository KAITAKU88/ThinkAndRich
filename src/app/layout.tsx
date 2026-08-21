import type { Metadata } from "next";
import { Newsreader, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
    <html lang="vi" suppressHydrationWarning>
      <body className={`${sora.variable} ${newsreader.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

