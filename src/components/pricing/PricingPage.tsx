"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

export function PricingPage() {
  const search = useSearchParams();
  const highlight = search.get("highlight");
  const user = useSession((s) => s.user);
  const current = user?.subscriptionTier ?? "FREE";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Chọn gói phù hợp với bạn
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Huỷ bất cứ lúc nào. So sánh quyền lợi — thanh toán chỉ diễn ra ở bước
          tiếp theo khi bạn chọn gói trả phí.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
        {PLANS.map((plan) => {
          const isHighlight =
            plan.highlighted ||
            (highlight === "premium" && plan.id === "PREMIUM") ||
            (highlight === "super" && plan.id === "SUPER");
          const isCurrent = current === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col relative",
                isHighlight &&
                  "border-primary shadow-[0_0_40px_rgba(29,78,216,0.15)] md:-translate-y-2"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="uppercase text-[10px] tracking-wider px-3 py-1 rounded-full">
                    Phổ biến nhất
                  </Badge>
                </div>
              )}
              <CardHeader className={cn("pb-4", plan.highlighted && "pt-8")}>
                <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                <div className="mt-4 text-3xl font-bold flex items-baseline flex-wrap gap-1">
                  {plan.priceLabel}
                  <span className="text-sm font-medium text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.id === "FREE" ? (
                  <Button variant="outline" className="w-full" disabled>
                    {isCurrent ? "Đang dùng" : "Miễn phí"}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Đang dùng
                  </Button>
                ) : (
                  <Button
                    variant={isHighlight ? "default" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link
                      href={`/checkout?plan=${plan.id.toLowerCase()}`}
                    >
                      {plan.id === "SUPER" ? "Tiếp tục với Super" : "Tiếp tục với Premium"}
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
