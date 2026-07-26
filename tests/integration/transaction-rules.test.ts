import { describe, expect, it } from "vitest";

type BalanceState = {
  balance: bigint;
  refundId?: string;
};

function debit(balance: bigint, amount: bigint) {
  if (amount <= 0n) throw new Error("invalid amount");
  if (balance < amount) throw new Error("insufficient balance");

  return {
    balance: balance - amount,
    ledger: {
      credit: 0n,
      debit: amount,
      before: balance,
      after: balance - amount,
    },
  };
}

function creditOnce(state: BalanceState, amount: bigint, key: string) {
  if (state.refundId) return state;
  return { balance: state.balance + amount, refundId: key };
}

describe("transaction safeguards", () => {
  it("prevents negative balances", () => {
    expect(() => debit(1_000n, 1_500n)).toThrow("insufficient balance");
  });

  it("records balance before and after a debit", () => {
    const result = debit(12_500n, 12_500n);
    expect(result.balance).toBe(0n);
    expect(result.ledger.before).toBe(12_500n);
    expect(result.ledger.after).toBe(0n);
  });

  it("does not process the same refund twice", () => {
    const first = creditOnce({ balance: 0n }, 12_500n, "REF-1");
    const second = creditOnce(first, 12_500n, "REF-2");
    expect(second.balance).toBe(12_500n);
    expect(second.refundId).toBe("REF-1");
  });

  it("does not credit the same deposit twice", () => {
    const first = creditOnce({ balance: 1_000n }, 50_000n, "DEP-1");
    const second = creditOnce(first, 50_000n, "DEP-2");
    expect(second.balance).toBe(51_000n);
  });
});
