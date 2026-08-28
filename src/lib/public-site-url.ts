/**
 * Builds the one canonical public-site URL from the Worker configuration.
 * A missing or malformed host deliberately falls back to the current origin,
 * which keeps local development usable without advertising a wrong domain.
 */
export function publicSiteUrl(publicHost: string | undefined): string {
  const host = publicHost?.trim();
  if (!host) return "/";

  try {
    const url = new URL(`https://${host}`);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return "/";
    return url.toString();
  } catch {
    return "/";
  }
}
