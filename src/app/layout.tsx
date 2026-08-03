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
  title: "IdeaVault — Thư viện ý tưởng khởi nghiệp",
  description:
    "Khám phá ý tưởng khởi nghiệp kèm mô hình doanh thu, kế hoạch triển khai và số liệu tài chính.",
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
