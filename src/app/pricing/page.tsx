import { Suspense } from "react";
import { PricingPage } from "@/components/pricing/PricingPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-muted-foreground">Đang tải...</div>}>
      <PricingPage />
    </Suspense>
  );
}
