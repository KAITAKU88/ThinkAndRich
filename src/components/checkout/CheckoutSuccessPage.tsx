"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isCreditPackageId, packageById } from "@/lib/credit-packages";

function SuccessInner() {
  const search = useSearchParams();
  const rawPackage = search.get("package") || search.get("plan");
  const pack = isCreditPackageId(rawPackage) ? packageById(rawPackage) : null;
  const gateway = search.get("gateway");

  return (
    <div>
      <Card>
        <CardContent>
          <CheckCircle2 />
          <h1>
            Thanh toán thành công
          </h1>
          <p>
            {pack
              ? `${pack.credits.toLocaleString("vi-VN")} credit đã được cộng vào tài khoản.`
              : "Credit đã được cộng vào tài khoản."}
            {gateway ? ` Cổng thanh toán: ${gateway}.` : ""}{" "}
            Bạn có thể mở khóa bài viết trên Khám phá ngay.
          </p>
          <div>
            <Button asChild>
              <Link href="/explore">Khám phá thư viện</Link>
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
    <Suspense fallback={<div>...</div>}>
      <SuccessInner />
    </Suspense>
  );
}
