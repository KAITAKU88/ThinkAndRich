import { describe, expect, it } from "vitest";
import { computeRefreshDiffs } from "@/lib/server/pricing-refresh";
import { computePackagePrice } from "@/lib/credit-packages";

describe("computeRefreshDiffs", () => {
  it("reports no change when existing rows already match documented prices", () => {
    const existing = [
      { countryCode: "VN", packageId: "pack_1", computedPrice: computePackagePrice(150_000, "VN") },
      { countryCode: "US", packageId: "pack_2", computedPrice: computePackagePrice(300_000, "US") },
    ];
    const diffs = computeRefreshDiffs(existing);
    const vn1 = diffs.find((d) => d.countryCode === "VN" && d.packageId === "pack_1");
    const us2 = diffs.find((d) => d.countryCode === "US" && d.packageId === "pack_2");
    expect(vn1).toEqual({ countryCode: "VN", packageId: "pack_1", from: vn1?.to, to: vn1?.to });
    expect(us2?.from).toBe(us2?.to);
  });

  it("surfaces a changed market as from → to", () => {
    const next = computePackagePrice(150_000, "US");
    const diffs = computeRefreshDiffs([
      { countryCode: "US", packageId: "pack_1", computedPrice: next + 10 },
    ]);
    const us1 = diffs.find((d) => d.countryCode === "US" && d.packageId === "pack_1");
    expect(us1).toEqual({ countryCode: "US", packageId: "pack_1", from: next + 10, to: next });
  });
});
