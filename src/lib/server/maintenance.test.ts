import { describe, expect, it } from "vitest";
import { DISABLED_MAINTENANCE, isMaintenanceActive, MAINTENANCE_TTL_MS } from "@/lib/server/maintenance";

describe("isMaintenanceActive", () => {
  it("is off when the flag is disabled", () => {
    expect(isMaintenanceActive(DISABLED_MAINTENANCE, new Date())).toBe(false);
  });

  it("is on within the 15-minute window", () => {
    const now = new Date("2026-08-28T12:00:00.000Z");
    expect(
      isMaintenanceActive(
        {
          enabled: true,
          enabledAt: "2026-08-28T11:50:00.000Z",
          enabledBy: "admin",
          reason: "manual",
          messageVi: null,
          messageEn: null,
        },
        now
      )
    ).toBe(true);
  });

  it("self-heals after 15 minutes even if the flag is still on", () => {
    const now = new Date("2026-08-28T12:00:00.000Z");
    const enabledAt = new Date(now.getTime() - MAINTENANCE_TTL_MS - 1).toISOString();
    expect(
      isMaintenanceActive(
        {
          enabled: true,
          enabledAt,
          enabledBy: "cron",
          reason: "pricing_refresh",
          messageVi: null,
          messageEn: null,
        },
        now
      )
    ).toBe(false);
  });
});
