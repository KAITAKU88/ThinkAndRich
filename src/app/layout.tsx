import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Think & Rich API",
  description: "Backend API, D1 database, and MCP server for Think & Rich.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
