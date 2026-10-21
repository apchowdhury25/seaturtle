import { roundHalfUpDiv } from "@/lib/commerce";

export type ContributionModel = "percent_revenue" | "percent_profit" | "fixed_per_item" | "manual";

export type AccrualResult = {
  amountMinor: number;
  currency: string;
  basisMinor: number | null;
  status: "calculated" | "blocked" | "manual" | "ineligible";
  explanation: string;
};

export function calculateAccrual(input: {
  model: ContributionModel;
  rateBps: number | null;
  fixedMinor: number | null;
  programCurrency: string;
  orderCurrency: string;
  netMerchandiseMinor: number;
  knownProfitMinor: number | null;
  qualifyingItemCount: number;
  orderStatus: string;
  eligibleStatuses: string[];
  active: boolean;
  now?: Date;
  startsAt?: string | null;
  endsAt?: string | null;
}): AccrualResult {
  const currency = input.programCurrency;
  const now = input.now ?? new Date();
  if (!input.active) {
    return { amountMinor: 0, currency, basisMinor: null, status: "ineligible", explanation: "The contribution program is inactive." };
  }
  if (input.startsAt && now.getTime() < new Date(input.startsAt).getTime()) {
    return { amountMinor: 0, currency, basisMinor: null, status: "ineligible", explanation: "The contribution program has not started." };
  }
  if (input.endsAt && now.getTime() > new Date(input.endsAt).getTime()) {
    return { amountMinor: 0, currency, basisMinor: null, status: "ineligible", explanation: "The contribution program has ended." };
  }
  if (!input.eligibleStatuses.includes(input.orderStatus)) {
    return {
      amountMinor: 0,
      currency,
      basisMinor: null,
      status: "ineligible",
      explanation: "Only eligible paid orders accrue a contribution. This order is not in an eligible status.",
    };
  }
  if (input.programCurrency !== input.orderCurrency) {
    return {
      amountMinor: 0,
      currency,
      basisMinor: null,
      status: "blocked",
      explanation: "The order currency does not match the program currency, and no exchange rate was applied.",
    };
  }

  if (input.model === "manual") {
    return {
      amountMinor: 0,
      currency,
      basisMinor: input.netMerchandiseMinor,
      status: "manual",
      explanation: "This program records only manually approved contributions. Nothing was accrued automatically.",
    };
  }

  if (input.model === "percent_profit") {
    if (input.knownProfitMinor === null) {
      return {
        amountMinor: 0,
        currency,
        basisMinor: null,
        status: "blocked",
        explanation: "Profit is not recorded on this order, so a profit-based contribution was not estimated.",
      };
    }
    const bps = input.rateBps ?? 0;
    const basis = Math.max(input.knownProfitMinor, 0);
    return {
      amountMinor: roundHalfUpDiv(basis * bps, 10_000),
      currency,
      basisMinor: basis,
      status: "calculated",
      explanation: "Calculated from recorded profit. This is an accrual, not a payment.",
    };
  }

  if (input.model === "fixed_per_item") {
    const fixed = input.fixedMinor ?? 0;
    const count = Math.max(input.qualifyingItemCount, 0);
    return {
      amountMinor: fixed * count,
      currency,
      basisMinor: count,
      status: "calculated",
      explanation: "Calculated as a fixed amount for each qualifying item. This is an accrual, not a payment.",
    };
  }

  const bps = input.rateBps ?? 0;
  const basis = Math.max(input.netMerchandiseMinor, 0);
  return {
    amountMinor: roundHalfUpDiv(basis * bps, 10_000),
    currency,
    basisMinor: basis,
    status: "calculated",
    explanation: "Calculated from merchandise value after discounts, excluding shipping and tax. This is an accrual, not a payment.",
  };
}
