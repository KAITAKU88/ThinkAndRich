/**
 * Which of the site's two surfaces a hostname is asking for.
 *
 * The console and the public site are one Worker answering on two custom
 * domains, so the Host header is the only thing that can tell them apart.
 * That decision used to sit inline in src/middleware.ts, tangled with the
 * session check and the redirect building, which meant the only way to
 * exercise it was a 14-minute end-to-end run. Two separate host-related
 * regressions duly sat unnoticed for a day. It is a pure lookup, so it
 * belongs somewhere it can be read as a table and tested in milliseconds.
 *
 * Deliberately dependency-free: the middleware bundle it feeds has to keep
 * its import surface minimal (see the note at the top of src/middleware.ts).
 */

export type Surface =
  /** The console's own hostname. Serves the console and nothing else. */
  | "console"
  /**
   * The public site — and every other hostname the deployment answers on,
   * the `*.workers.dev` address included. Never serves the console: the
   * whole point of the split is that there is exactly one door to it.
   */
  | "public"
  /**
   * No split is in force, so one origin serves both. Either no ADMIN_HOST is
   * configured, or a dev server is answering on a loopback address, where
   * there is no second hostname to send anything to.
   */
  | "unsplit";

export interface HostRoutingConfig {
  /** ADMIN_HOST. Absent means no split is configured at all. */
  adminHost?: string;
  /**
   * Whether this request reached a development server over loopback. Passed
   * in rather than detected here so the rule stays a pure function of its
   * inputs — and so the exemption is a named argument in the table below
   * instead of a special case buried mid-flow.
   */
  isLoopbackDev?: boolean;
}

/**
 * | adminHost | host              | isLoopbackDev | surface   |
 * | --------- | ----------------- | ------------- | --------- |
 * | unset     | anything          | either        | unsplit   |
 * | set       | === adminHost     | either        | console   |
 * | set       | anything else     | true          | unsplit   |
 * | set       | anything else     | false         | public    |
 *
 * The console match is tested before the loopback exemption so that pointing
 * ADMIN_HOST at a loopback name still yields a console, rather than the
 * exemption quietly swallowing it.
 */
export function surfaceFor(
  host: string | null | undefined,
  { adminHost, isLoopbackDev = false }: HostRoutingConfig
): Surface {
  const configured = normalizeHost(adminHost);
  if (!configured) return "unsplit";
  if (normalizeHost(host) === configured) return "console";
  return isLoopbackDev ? "unsplit" : "public";
}

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLoopbackHostname(hostname: string | null | undefined): boolean {
  return LOOPBACK_HOSTNAMES.has(normalizeHost(hostname) ?? "");
}

/**
 * A Host header carries a port whenever the origin is not on the default
 * one, while the configured hostnames never do — so comparing the two raw
 * would silently fail to match. Both sides go through here.
 *
 * The port cannot just be chopped off after the last colon: a bare IPv6
 * address is all colons, and "::1" would come back as ":". A Host header
 * brackets IPv6 literals precisely so the port stays unambiguous, so follow
 * that rule and leave anything else with more than one colon alone.
 */
function normalizeHost(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("[")) {
    const closing = trimmed.indexOf("]");
    return closing === -1 ? trimmed : trimmed.slice(0, closing + 1);
  }

  const colon = trimmed.indexOf(":");
  if (colon === -1) return trimmed;
  if (trimmed.indexOf(":", colon + 1) !== -1) return trimmed; // bare IPv6, no port
  return trimmed.slice(0, colon) || undefined;
}
