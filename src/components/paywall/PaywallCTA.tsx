import Link from "next/link";
import { Lock, Crown, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SubscriptionTier } from "@/lib/types";

export function PaywallCTA({ required }: { required: SubscriptionTier }) {
  const isSuper = required === "SUPER";
  return (
    <div className="absolute bottom-0 left-0 right-0 min-h-[70%] bg-gradient-to-t from-background via-background/95 to-transparent flex flex-col items-center justify-end pb-2 pt-28">
      <Card className="max-w-md w-full mx-2 border-dashed relative overflow-hidden">
        <div className="absolute -right-6 -top-6 rotate-12 opacity-10">
          <Stamp className="w-28 h-28" />
        </div>
        <CardContent className="p-6 md:p-8 text-center relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isSuper ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-accent text-primary"
            }`}
          >
            {isSuper ? <Crown className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Sealed dossier
          </p>
          <h3 className="font-display text-xl font-semibold mb-2">
            {isSuper
              ? "Ý tưởng Super — chỉ dành cho Super"
              : "Nội dung dành cho thành viên Premium"}
          </h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Mở khoá kế hoạch triển khai, số liệu tài chính và phân tích rủi ro đầy đủ.
          </p>
          <Button size="lg" className="w-full font-semibold" asChild>
            <Link href={`/pricing?highlight=${isSuper ? "super" : "premium"}`}>
              Xem gói đăng ký
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
