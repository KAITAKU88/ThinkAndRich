"use client";

import { useState } from "react";
import { Globe, Check, ChevronDown, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/store/session";
import {
  SUPPORTED_LANGUAGES_LIST,
  getTranslation,
} from "@/lib/i18n/translations";
import {
  COUNTRIES_LIST,
  PPP_PRICING_MAP,
  getPppPricing,
} from "@/lib/geo-pricing";
import type { CountryCode, SupportedLanguage } from "@/lib/types";
import { toast } from "sonner";

export function LanguageSelector() {
  const language = useSession((s) => s.language);
  const setLanguage = useSession((s) => s.setLanguage);
  const countryCode = useSession((s) => s.countryCode);
  const setCountryCode = useSession((s) => s.setCountryCode);

  const [regionModalOpen, setRegionModalOpen] = useState(false);

  const t = getTranslation(language);
  const currentLangObj =
    SUPPORTED_LANGUAGES_LIST.find((l) => l.code === language) ||
    SUPPORTED_LANGUAGES_LIST[0];
  const currentPpp = getPppPricing(countryCode);

  function handleSelectLang(code: SupportedLanguage) {
    setLanguage(code);
    toast.success(
      `Đã chuyển ngôn ngữ sang ${
        SUPPORTED_LANGUAGES_LIST.find((l) => l.code === code)?.label
      }`
    );
  }

  function handleSelectCountry(code: CountryCode) {
    setCountryCode(code);
    setRegionModalOpen(false);
    const country = PPP_PRICING_MAP[code];
    toast.success(
      `📍 Đã mô phỏng IP khu vực: ${country.countryName} (${country.currency} - ${country.gateway === "sepay" ? "SePay" : "Lemon Squeezy"})`
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Language Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-2.5 h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border"
              title="Đổi ngôn ngữ giao diện (Language)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-semibold">{currentLangObj.flag}</span>
              <span className="hidden sm:inline-block uppercase tracking-wider text-[10px] font-bold">
                {currentLangObj.code}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-2xl border-border/80">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold px-2 py-1 flex items-center justify-between">
              <span>Ngôn ngữ (14 Quốc gia)</span>
              <span className="text-[10px] text-primary font-bold">{currentLangObj.code.toUpperCase()}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto space-y-0.5 pr-1">
              {SUPPORTED_LANGUAGES_LIST.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleSelectLang(lang.code)}
                  className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div>
                      <span className="font-medium text-foreground block leading-tight">{lang.nativeLabel}</span>
                      <span className="text-[10px] text-muted-foreground leading-none">{lang.label}</span>
                    </div>
                  </div>
                  {language === lang.code && (
                    <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setRegionModalOpen(true)}
              className="rounded-xl px-2.5 py-1.5 text-xs text-primary font-semibold cursor-pointer flex items-center justify-between hover:bg-primary/10"
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Tiền tệ IP (PPP): {currentPpp.currency}</span>
              </div>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/40 bg-primary/5">
                {currentPpp.flag} {currentPpp.countryCode}
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>

        </DropdownMenu>
      </div>

      {/* PPP Region / Currency Lock Simulation Dialog */}
      <Dialog open={regionModalOpen} onOpenChange={setRegionModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-5 h-5" />
            </div>
            <DialogTitle className="text-center font-display text-xl font-bold">
              {t.pricing.detectedRegion} {currentPpp.countryName}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              {t.pricing.currencyLockDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Định tuyến Cổng thanh toán:</span>
                <Badge
                  className={
                    currentPpp.gateway === "sepay"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-amber-600 text-white font-bold"
                  }
                >
                  {currentPpp.gateway === "sepay"
                    ? "SePay (VietQR Nội địa)"
                    : "Lemon Squeezy (Thẻ Quốc tế / Apple Pay)"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Đồng tiền thanh toán:</span>
                <span className="font-bold text-foreground">
                  {currentPpp.currency} ({currentPpp.currencySymbol})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hệ số PPP:</span>
                <span className="text-muted-foreground italic text-[11px]">
                  {currentPpp.pppFactorNote}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                Mô phỏng IP Quốc gia (Kiểm tra Bảng giá PPP):
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {COUNTRIES_LIST.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c.code)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border text-xs transition-all ${
                      countryCode === c.code
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{c.flag}</span>
                      <span className="truncate">{c.code}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {c.gateway === "sepay" ? "SePay" : "Lemon"}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-primary/5 p-2.5 rounded-xl border border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                Theo tiêu chuẩn PRD, tiền tệ thanh toán được khóa cứng độc lập với ngôn ngữ giao diện.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
