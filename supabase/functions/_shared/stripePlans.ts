// Shared Stripe plan mapping for backend functions
// Keep this file as the single source of truth for priceId -> planId.

export const PRICE_TO_PLAN_ID = {
  // Basic
  price_1SpOpRQrqKHReEDtP3WD1zne: "basic",
  // Pro
  price_1SpOqPQrqKHReEDtqHZcLsbY: "pro",
  // Insider
  price_1Sn2CkQrqKHReEDtvJ6iR1gz: "insider",
} as const;

export type PlanId = (typeof PRICE_TO_PLAN_ID)[keyof typeof PRICE_TO_PLAN_ID];

export function getPlanIdFromPriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null;
  return (PRICE_TO_PLAN_ID as Record<string, PlanId>)[priceId] ?? null;
}

export function getPlanIdFromAmount(amountCents?: number | null): PlanId | null {
  if (amountCents === 499) return "basic";
  if (amountCents === 1399) return "pro";
  if (amountCents === 4999) return "insider";
  return null;
}
