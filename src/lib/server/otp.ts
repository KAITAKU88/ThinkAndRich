export { OTP_TTL_MINUTES, OTP_TTL_SECONDS } from "@/lib/otp-policy";

/**
 * KV key for one issued code.
 *
 * The code is part of the key rather than the value, so every code gets its
 * own entry and several can be outstanding at once. Storing one entry per
 * *email* instead meant each "resend" silently overwrote the previous code,
 * so a user who clicked resend and then typed the code from the earlier
 * message was told it was wrong — with no way to tell that from a genuinely
 * expired code.
 *
 * Multiple live codes barely move the guessing odds (a handful of six-digit
 * values out of a million, over the code's lifetime, behind a cap on
 * verification attempts), and they remove a failure mode users hit constantly.
 */
export function otpKey(email: string, code: string): string {
  return `otp:${email}:${code}`;
}
