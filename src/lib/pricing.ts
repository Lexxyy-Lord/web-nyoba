import type { PricingRule, PricingScope, ProfitType } from "@prisma/client";
import { env } from "@/lib/env";
import { roundMoney } from "@/lib/money";

export type PricingContext = {
  serviceId?: string | null;
  countryId?: string | null;
  providerId?: string | null;
};

type RuleLike = Pick<PricingRule, "id" | "scope" | "profitType" | "fixedAmount" | "percentage" | "minimumSelling" | "maximumSelling" | "roundingIncrement" | "active" | "priority" | "validFrom" | "validUntil" | "serviceId" | "countryId" | "providerId">;

const scopeRank: Record<PricingScope, number> = { SERVICE: 4, COUNTRY: 3, PROVIDER: 2, GLOBAL: 1 };

export function calculateProfit(costPrice: bigint, profitType: ProfitType, fixedAmount: bigint, percentage: number) {
  const percentageAmount = BigInt(Math.ceil(Number(costPrice) * (percentage / 100)));
  if (profitType === "FIXED") return fixedAmount;
  if (profitType === "PERCENTAGE") return percentageAmount;
  return fixedAmount + percentageAmount;
}

export function selectPricingRule(rules: RuleLike[], context: PricingContext, now = new Date()) {
  return rules
    .filter((rule) => {
      if (!rule.active) return false;
      if (rule.validFrom && rule.validFrom > now) return false;
      if (rule.validUntil && rule.validUntil < now) return false;
      if (rule.scope === "SERVICE") return Boolean(context.serviceId && rule.serviceId === context.serviceId);
      if (rule.scope === "COUNTRY") return Boolean(context.countryId && rule.countryId === context.countryId);
      if (rule.scope === "PROVIDER") return Boolean(context.providerId && rule.providerId === context.providerId);
      return rule.scope === "GLOBAL";
    })
    .sort((a, b) => scopeRank[b.scope] - scopeRank[a.scope] || b.priority - a.priority)[0];
}

export function computeSellingPrice(costPrice: bigint, rule?: RuleLike | null) {
  const fallbackFixed = env().OTP_DEFAULT_PROFIT;
  const profitType = rule?.profitType ?? "FIXED";
  const fixedAmount = rule?.fixedAmount ?? fallbackFixed;
  const percentage = rule ? Number(rule.percentage) : 0;
  const rawProfit = calculateProfit(costPrice, profitType, fixedAmount, percentage);
  let sellingPrice = costPrice + rawProfit;
  const minimum = rule?.minimumSelling ?? env().OTP_MIN_SELLING_PRICE;
  const maximum = rule?.maximumSelling ?? null;
  if (sellingPrice < minimum) sellingPrice = minimum;
  if (maximum !== null && sellingPrice > maximum) sellingPrice = maximum;
  sellingPrice = roundMoney(sellingPrice, rule?.roundingIncrement ?? env().OTP_PRICE_ROUNDING);
  return { sellingPrice, profitAmount: sellingPrice - costPrice, ruleId: rule?.id ?? null };
}
