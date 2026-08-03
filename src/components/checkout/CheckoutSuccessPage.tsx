"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function SuccessInner() {
  const search = useSearchParams();
  const plan = (search.get("plan") || "premium").toUpperCase();
  const gateway = search.get("gateway") || "stripe";

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-semibold">
            Thanh toán thành công
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Gói <strong>{plan}</strong> đã được kích hoạt (mock) qua{" "}
            <strong>{gateway.toUpperCase()}</strong>. Bạn có thể mở các dossier
            đúng quyền ngay bây giờ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild>
              <Link href="/">Khám phá ý tưởng</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">Về trang cá nhân</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">...</div>}>
      <SuccessInner />
    </Suspense>
  );
}
