import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({
    OTP_DEFAULT_PROFIT: 10_000n,
    OTP_PRICE_ROUNDING: 100,
    OTP_MIN_SELLING_PRICE: 0n,
  }),
}));

import {
  calculateProfit,
  computeSellingPrice,
  selectPricingRule,
} from "@/lib/pricing";

const baseRule = {
  active: true,
  priority: 0,
  validFrom: null,
  validUntil: null,
  minimumSelling: null,
  maximumSelling: null,
  roundingIncrement: 100,
  serviceId: null,
  countryId: null,
  providerId: null,
  percentage: { toString: () => "0" },
};

describe("pricing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates fixed profit", () => {
    expect(calculateProfit(2_500n, "FIXED", 10_000n, 0)).toBe(10_000n);
  });

  it("calculates percentage profit", () => {
    expect(calculateProfit(10_000n, "PERCENTAGE", 0n, 10)).toBe(1_000n);
  });

  it("calculates combined profit", () => {
    expect(calculateProfit(10_000n, "COMBINED", 500n, 10)).toBe(1_500n);
  });

  it("uses fallback profit and configured rounding", () => {
    expect(computeSellingPrice(2_501n).sellingPrice).toBe(12_600n);
  });

  it("prioritizes service rules before country, provider, and global", () => {
    const rules = [
      {
        ...baseRule,
        id: "global",
        scope: "GLOBAL",
        profitType: "FIXED",
        fixedAmount: 1n,
      },
      {
        ...baseRule,
        id: "provider",
        scope: "PROVIDER",
        providerId: "provider-1",
        profitType: "FIXED",
        fixedAmount: 2n,
      },
      {
        ...baseRule,
        id: "country",
        scope: "COUNTRY",
        countryId: "country-1",
        profitType: "FIXED",
        fixedAmount: 3n,
      },
      {
        ...baseRule,
        id: "service",
        scope: "SERVICE",
        serviceId: "service-1",
        profitType: "FIXED",
        fixedAmount: 4n,
      },
    ] as never;

    expect(
      selectPricingRule(rules, {
        serviceId: "service-1",
        countryId: "country-1",
        providerId: "provider-1",
      })?.id,
    ).toBe("service");
  });
});
