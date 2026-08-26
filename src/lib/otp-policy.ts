/**
 * How long a login code stays usable.
 *
 * Five minutes was too short for a code that arrives by email. Cloudflare's
 * send_email call alone took ~5s server-side before the message even left,
 * and by the time it reached an inbox the code had often expired — so every
 * attempt failed, resending produced another code that also expired, and the
 * account was effectively locked out with nothing in the logs to say why.
 *
 * Fifteen minutes does not weaken the code: guessing six digits inside it is
 * bounded by the eight-attempt limit in /api/auth/verify-otp, not by the
 * window.
 *
 * Client-safe on purpose — the email body and the toast both quote this
 * number, and the point of having one constant is that they cannot drift
 * apart from it or from each other.
 */
export const OTP_TTL_SECONDS = 15 * 60;

export const OTP_TTL_MINUTES = OTP_TTL_SECONDS / 60;
