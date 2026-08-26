import { describe, it, expect } from "vitest";
import { isLoopbackHostname, surfaceFor } from "./host-routing";

const ADMIN_HOST = "admin.thinkandrich.ankiva.cc";
const PUBLIC_HOST = "thinkandrich.ankiva.cc";
// workers_dev is on, so the deployment answers here too. This hostname is
// the reason the fallback has to be "public" rather than "whatever is left":
// treating an unrecognised host as unsplit would put a second door on the
// console, which is the exact thing splitting the hostnames removed.
const WORKERS_DEV = "thinkandrich.thankful-to-all-88.workers.dev";

describe("surfaceFor", () => {
  describe("with the split configured", () => {
    const config = { adminHost: ADMIN_HOST };

    it("serves the console on its own hostname", () => {
      expect(surfaceFor(ADMIN_HOST, config)).toBe("console");
    });

    it("serves the public site on the public hostname", () => {
      expect(surfaceFor(PUBLIC_HOST, config)).toBe("public");
    });

    it("treats the workers.dev address as public, never as the console", () => {
      expect(surfaceFor(WORKERS_DEV, config)).toBe("public");
    });

    it("treats any unrecognised hostname as public", () => {
      expect(surfaceFor("someone-elses-domain.example", config)).toBe("public");
      expect(surfaceFor("192.0.2.10", config)).toBe("public");
    });

    it("treats a missing Host header as public", () => {
      expect(surfaceFor(null, config)).toBe("public");
      expect(surfaceFor(undefined, config)).toBe("public");
      expect(surfaceFor("", config)).toBe("public");
    });
  });

  describe("without the split configured", () => {
    it("leaves one origin serving both surfaces", () => {
      expect(surfaceFor(PUBLIC_HOST, {})).toBe("unsplit");
      expect(surfaceFor(ADMIN_HOST, {})).toBe("unsplit");
      expect(surfaceFor("localhost:3000", { adminHost: "   " })).toBe("unsplit");
    });
  });

  // The exemption that lets `next dev` serve the console at all. It is the
  // one deliberate hole in the split, so it gets pinned down from both sides.
  describe("loopback development exemption", () => {
    it("drops the split for a dev server on loopback", () => {
      expect(surfaceFor("localhost:3000", { adminHost: ADMIN_HOST, isLoopbackDev: true })).toBe(
        "unsplit"
      );
    });

    it("keeps the split when the request is not a loopback dev request", () => {
      expect(surfaceFor("localhost:3000", { adminHost: ADMIN_HOST, isLoopbackDev: false })).toBe(
        "public"
      );
      expect(surfaceFor("localhost:3000", { adminHost: ADMIN_HOST })).toBe("public");
    });

    it("does not let the exemption swallow a console hostname", () => {
      expect(surfaceFor("localhost", { adminHost: "localhost", isLoopbackDev: true })).toBe(
        "console"
      );
    });

    it("never reaches the console from a non-loopback host, exemption or not", () => {
      expect(surfaceFor(WORKERS_DEV, { adminHost: ADMIN_HOST, isLoopbackDev: true })).toBe(
        "unsplit"
      );
      expect(surfaceFor(WORKERS_DEV, { adminHost: ADMIN_HOST, isLoopbackDev: false })).toBe(
        "public"
      );
    });
  });

  describe("host normalisation", () => {
    it("ignores case and surrounding whitespace on both sides", () => {
      expect(surfaceFor(` ADMIN.ThinkAndRich.Ankiva.CC `, { adminHost: ADMIN_HOST })).toBe(
        "console"
      );
      expect(surfaceFor(ADMIN_HOST, { adminHost: " Admin.ThinkAndRich.Ankiva.cc " })).toBe(
        "console"
      );
    });

    // A Host header carries a port whenever the origin is not on the default
    // one; the configured hostname never does. Comparing them raw would fail
    // to match a console served on any non-443 port.
    it("ignores the port on either side", () => {
      expect(surfaceFor(`${ADMIN_HOST}:443`, { adminHost: ADMIN_HOST })).toBe("console");
      expect(surfaceFor(`${ADMIN_HOST}:8787`, { adminHost: ADMIN_HOST })).toBe("console");
      expect(surfaceFor("localhost:3000", { adminHost: "localhost:3000" })).toBe("console");
    });

    it("does not confuse a subdomain with the host itself", () => {
      expect(surfaceFor(`evil.${ADMIN_HOST}`, { adminHost: ADMIN_HOST })).toBe("public");
      expect(surfaceFor(`${ADMIN_HOST}.evil.example`, { adminHost: ADMIN_HOST })).toBe("public");
    });
  });
});

describe("isLoopbackHostname", () => {
  it("recognises the loopback names a dev server answers on", () => {
    for (const hostname of ["localhost", "127.0.0.1", "::1", "[::1]", "LOCALHOST", " localhost "]) {
      expect(isLoopbackHostname(hostname)).toBe(true);
    }
  });

  it("rejects everything else", () => {
    for (const hostname of [ADMIN_HOST, PUBLIC_HOST, WORKERS_DEV, "127.0.0.2", "", null, undefined]) {
      expect(isLoopbackHostname(hostname)).toBe(false);
    }
  });
});
