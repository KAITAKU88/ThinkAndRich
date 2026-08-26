"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, CalendarClock, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/**
 * Mid-term PLUS → PRO upgrade.
 *
 * Every figure shown here is quoted by the server (GET /api/upgrade) and
 * never recomputed in the browser: the price depends on how long the term
 * has run, and a second implementation of that rule is a second answer to
 * the same question. Confirming re-quotes server-side before charging, so
 * what is shown is a quote rather than a promise — a modal left open
 * overnight cannot lock in yesterday's number.
 */

interface UpgradeQuoteResponse {
  ok: true;
  remainingCredit: number;
  topUpAmount: number;
  currency: string;
  currencySymbol: string;
  expiresAt: string;
  daysUsed: number;
  creditedFromRecordedTerm: boolean;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Overrides the detected market — the pricing page's country simulator. */
  countryCode?: string;
}

export function UpgradeModal({ open, onOpenChange, countryCode }: UpgradeModalProps) {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const router = useRouter();

  const [quote, setQuote] = useState<UpgradeQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = countryCode ? `?country=${encodeURIComponent(countryCode)}` : "";

  const loadQuote = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/upgrade${query}`, { cache: "no-store" });
      const data = (await res.json()) as UpgradeQuoteResponse | { ok: false; message?: string };
      if (!res.ok || !("ok" in data) || !data.ok) {
        setError(("message" in data && data.message) || t.upgrade.failed);
        setQuote(null);
        return;
      }
      setQuote(data);
    } catch {
      setError(t.upgrade.failed);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [query, t.upgrade.failed]);

  // Re-quote on every open rather than once on mount: the term ages, and a
  // stale figure here is a figure the checkout will refuse to honour.
  useEffect(() => {
    if (open) void loadQuote();
  }, [open, loadQuote]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/upgrade${query}`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; orderId?: string; message?: string };
      if (!res.ok || !data.ok || !data.orderId) {
        toast.error(data.message || t.upgrade.failed);
        return;
      }
      // The order is PENDING; the tier moves only once the gateway settles it
      // and the billing webhook grants it. Hand the member to the same
      // payment screen a first-time purchase uses.
      onOpenChange(false);
      router.push(`/checkout?plan=PRO&order=${data.orderId}`);
    } catch {
      toast.error(t.upgrade.failed);
    } finally {
      setSubmitting(false);
    }
  }

  const money = (amount: number) =>
    `${amount.toLocaleString(language === "vi" ? "vi-VN" : language)} ${quote?.currency ?? ""}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-primary" />
            {t.upgrade.title}
          </DialogTitle>
          <DialogDescription>{t.upgrade.subtitle}</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.upgrade.loading}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {!loading && quote && (
          <div className="space-y-3">
            <Row
              icon={<Wallet className="w-4 h-4" />}
              label={t.upgrade.remainingCredit}
              value={money(quote.remainingCredit)}
            />
            <Row
              icon={<ArrowUpCircle className="w-4 h-4" />}
              label={t.upgrade.payToday}
              value={money(quote.topUpAmount)}
              emphasis
            />
            <Row
              icon={<CalendarClock className="w-4 h-4" />}
              label={t.upgrade.newExpiry}
              value={new Date(quote.expiresAt).toLocaleDateString(
                language === "vi" ? "vi-VN" : language,
                { day: "2-digit", month: "2-digit", year: "numeric" }
              )}
            />

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t.upgrade.termNote}
              {!quote.creditedFromRecordedTerm && ` ${t.upgrade.noCreditNote}`}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t.upgrade.cancelBtn}
          </Button>
          <Button onClick={handleConfirm} disabled={!quote || submitting || loading}>
            {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            {t.upgrade.confirmBtn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon,
  label,
  value,
  emphasis = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5",
        emphasis ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/40"
      )}
    >
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={emphasis ? "text-primary" : ""}>{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          "text-right font-semibold tabular-nums",
          emphasis ? "text-base text-primary" : "text-sm text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
