import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

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

/** Step 1 teardown — system fonts only; custom typography returns in Step 3. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
