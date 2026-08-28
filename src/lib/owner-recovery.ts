export const OWNER_RECOVERY_HASH_KEY = "owner.recoveryCodeHash";
export const ADMIN_SESSION_EPOCH_KEY = "admin:sessionEpoch";

function envString(env: object, key: string): string {
  const value = (env as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function ownerEmailFromEnv(env: object): string {
  const frozen = envString(env, "OWNER_EMAIL").trim().toLowerCase();
  if (frozen && frozen.includes("@")) return frozen;
  const first = envString(env, "ADMIN_EMAILS")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .find((entry) => entry.includes("@"));
  return first ?? "";
}

export function isAdminSessionStale(iat: number | undefined, epochSeconds: number): boolean {
  if (!epochSeconds) return false;
  return (iat ?? 0) < epochSeconds;
}

export function generateRecoveryCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function recoveryCodesMatch(hashA: string, hashB: string): boolean {
  if (hashA.length !== hashB.length || hashA.length === 0) return false;
  let mismatch = 0;
  for (let i = 0; i < hashA.length; i++) {
    mismatch |= hashA.charCodeAt(i) ^ hashB.charCodeAt(i);
  }
  return mismatch === 0;
}
