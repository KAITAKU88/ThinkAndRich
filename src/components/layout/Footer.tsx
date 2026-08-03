"use client";

import Link from "next/link";
import { useSession } from "@/store/session";

export function Footer() {
  const brand = useSession((s) => s.settings.brandName);
  return (
    <footer className="border-t border-border bg-card/60 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© 2026 {brand}. Thư viện ý tưởng khởi nghiệp toàn cầu.</p>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="hover:text-foreground">
            Bảng giá
          </Link>
          <Link href="/profile" className="hover:text-foreground">
            Cá nhân
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Đăng nhập
          </Link>
        </div>
      </div>
    </footer>
  );
}
