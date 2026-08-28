import type { SessionUser } from "@/lib/types";
import { refreshWallet, totalAvailable, walletFromUserRow } from "@/lib/credits";

export type UserCreditRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  countryCode: string | null;
  preferredLang: string | null;
  paidCreditBalance: number;
  paidCreditExpiresAt: string | null;
  giftCreditBalance: number;
  giftCreditDate: string | null;
  giftGrantedThisMonth: number;
  giftMonth: string | null;
};

export function toSessionUser(row: UserCreditRow, now: Date = new Date()): SessionUser {
  const wallet = refreshWallet(walletFromUserRow(row), now);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as SessionUser["role"],
    countryCode: row.countryCode ?? undefined,
    preferredLang: row.preferredLang ?? undefined,
    paidCreditBalance: wallet.paidCreditBalance,
    paidCreditExpiresAt: wallet.paidCreditExpiresAt,
    giftCreditBalance: wallet.giftCreditBalance,
    giftGrantedThisMonth: wallet.giftGrantedThisMonth,
    totalCredits: totalAvailable(wallet, now),
  };
}
