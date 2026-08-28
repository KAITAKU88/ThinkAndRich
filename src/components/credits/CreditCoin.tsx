import { cn } from "@/lib/utils";

export function CreditCoin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("inline-block shrink-0", className)} aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" fill="#E8B923" stroke="#B8860B" strokeWidth="1.1" />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="#F8E08E" strokeWidth="1" />
      <path
        d="M8 4.6v6.8M6.15 6.35c.7-.85 3.95-.85 4.7 0M6.15 9.65c.7.85 3.95.85 4.7 0"
        stroke="#9A6B0A"
        strokeWidth="1.05"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
