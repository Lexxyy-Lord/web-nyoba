import { describe, expect, it } from "vitest";
import { formatRupiah, parseRupiah, roundMoney } from "@/lib/money";

describe("money helpers", () => {
  it("formats IDR without fractional digits", () => {
    expect(formatRupiah(12_500)).toContain("12.500");
  });

  it("parses formatted currency input", () => {
    expect(parseRupiah("Rp12.500")).toBe(12_500n);
  });

  it("rounds selling prices upward", () => {
    expect(roundMoney(12_501n, 100)).toBe(12_600n);
    expect(roundMoney(12_501n, 500)).toBe(13_000n);
    expect(roundMoney(12_501n, 1_000)).toBe(13_000n);
  });
});
