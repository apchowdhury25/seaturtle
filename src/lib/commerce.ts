export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export const CURRENCY_EXPONENTS: Record<string, number> = {
  USD: 2,
  BDT: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  BHD: 3,
};

export function currencyExponent(currency: string): number {
  return CURRENCY_EXPONENTS[currency] ?? 2;
}

export function assertSafeAmount(value: number, label = "amount"): number {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be a safe integer in minor units.`);
  }
  return value;
}

export function roundHalfUpDiv(numerator: number, denominator: number): number {
  assertSafeAmount(numerator, "numerator");
  if (!Number.isSafeInteger(denominator) || denominator === 0) {
    throw new MoneyError("denominator must be a non-zero integer.");
  }
  const negative = numerator < 0 !== denominator < 0;
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  const quotient = Math.floor((n + Math.floor(d / 2)) / d);
  const signed = negative ? -quotient : quotient;
  return assertSafeAmount(signed, "rounded amount");
}

export function mulMinor(unitMinor: number, quantity: number): number {
  assertSafeAmount(unitMinor, "unit price");
  assertSafeAmount(quantity, "quantity");
  if (quantity < 0) throw new MoneyError("quantity cannot be negative.");
  const product = unitMinor * quantity;
  return assertSafeAmount(product, "line total");
}

export function toMajorString(amountMinor: number, currency: string): string {
  assertSafeAmount(amountMinor, "amount");
  const exponent = currencyExponent(currency);
  const negative = amountMinor < 0;
  const absolute = Math.abs(amountMinor);
  const factor = 10 ** exponent;
  const major = Math.trunc(absolute / factor);
  if (exponent === 0) return `${negative ? "-" : ""}${major}`;
  const fraction = String(absolute % factor).padStart(exponent, "0");
  return `${negative ? "-" : ""}${major}.${fraction}`;
}

export function majorToMinor(value: string, currency: string): number | null {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const match = unsigned.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const exponent = currencyExponent(currency);
  const fraction = match[2] ?? "";
  if (fraction.length > exponent) return null;
  const minor = Number(match[1]) * 10 ** exponent + Number(fraction.padEnd(exponent, "0") || 0);
  if (!Number.isSafeInteger(minor)) return null;
  return negative ? -minor : minor;
}

export function formatMinor(amountMinor: number, currency: string): string {
  const negative = amountMinor < 0;
  const body = toMajorString(Math.abs(amountMinor), currency);
  return `${negative ? "-" : ""}${currency} ${body.replace(/^-/, "")}`;
}

export type QuoteLine = {
  variantId: string;
  productId: string;
  categoryId: string | null;
  quantity: number;
  unitPriceMinor: number;
  currency: string;
  weightGrams: number;
  taxCategory: string;
  name: string;
  sku: string;
};

export type DiscountRule = {
  id: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  percentageBps: number | null;
  amountMinor: number | null;
  currency: string | null;
  minSubtotalMinor: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  customerRedemptions: number;
  isActive: boolean;
  productIds: string[] | null;
  categoryIds: string[] | null;
  firstOrderOnly: boolean;
};

export type ShippingMethodQuote = {
  id: string;
  name: string;
  currency: string;
  countries: string[];
  active: boolean;
  isDemonstration: boolean;
  flatMinor: number;
  freeThresholdMinor: number | null;
  minWeightGrams: number | null;
  maxWeightGrams: number | null;
  perKgMinor: number;
  estimateMinDays: number | null;
  estimateMaxDays: number | null;
};

export type TaxRule = {
  id: string;
  countryCode: string;
  regionCode: string | null;
  productTaxCategory: string | null;
  rateBps: number;
  inclusive: boolean;
  appliesToShipping: boolean;
  priority: number;
  active: boolean;
};

export type Destination = {
  countryCode: string;
  regionCode?: string | null;
};

export type DiscountDecision =
  | { ok: true; discountMinor: number; freeShipping: boolean; message: string }
  | { ok: false; discountMinor: 0; freeShipping: false; message: string };

export type Quote = {
  currency: string | null;
  lines: Array<QuoteLine & { lineTotalMinor: number }>;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  taxInclusive: boolean;
  taxConfigured: boolean;
  totalMinor: number;
  freeShipping: boolean;
  errors: string[];
  shippingEstimate: { minDays: number | null; maxDays: number | null } | null;
  weightGrams: number;
};

const MAX_QTY = 20;

export function quantityError(quantity: number): string | null {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Quantity must be a positive whole number.";
  }
  if (quantity > MAX_QTY) return `Quantity cannot exceed ${MAX_QTY} per item.`;
  return null;
}

export function availableToSell(onHand: number, reserved: number): number {
  assertSafeAmount(onHand, "on hand");
  assertSafeAmount(reserved, "reserved");
  return onHand - reserved;
}

export function withinWindow(now: Date, startsAt: string | null, endsAt: string | null): boolean {
  const time = now.getTime();
  if (startsAt && time < new Date(startsAt).getTime()) return false;
  if (endsAt && time > new Date(endsAt).getTime()) return false;
  return true;
}

export function activeUnitPrice(input: {
  regularMinor: number;
  saleMinor: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  if (
    input.saleMinor !== null &&
    input.saleMinor >= 0 &&
    input.saleMinor < input.regularMinor &&
    withinWindow(now, input.saleStartsAt, input.saleEndsAt)
  ) {
    return input.saleMinor;
  }
  return input.regularMinor;
}

function lineEligible(line: QuoteLine, discount: DiscountRule): boolean {
  const products = discount.productIds ?? [];
  const categories = discount.categoryIds ?? [];
  const productOk = products.length === 0 || products.includes(line.productId);
  const categoryOk = categories.length === 0 || (line.categoryId !== null && categories.includes(line.categoryId));
  if (products.length === 0 && categories.length === 0) return true;
  if (products.length > 0 && categories.length > 0) return productOk || categoryOk;
  return productOk && categoryOk;
}

export function evaluateDiscount(input: {
  discount: DiscountRule | null;
  lines: Array<QuoteLine & { lineTotalMinor: number }>;
  subtotalMinor: number;
  currency: string | null;
  customerIsFirstOrder: boolean;
  now?: Date;
}): DiscountDecision {
  const discount = input.discount;
  if (!discount) return { ok: true, discountMinor: 0, freeShipping: false, message: "" };
  const now = input.now ?? new Date();
  if (!discount.isActive) return { ok: false, discountMinor: 0, freeShipping: false, message: "This code is not active." };
  if (!withinWindow(now, discount.startsAt, discount.endsAt)) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This code is outside its valid dates." };
  }
  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This code has reached its usage limit." };
  }
  if (discount.perCustomerLimit !== null && discount.customerRedemptions >= discount.perCustomerLimit) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This code has already been used on this account." };
  }
  if (discount.firstOrderOnly && !input.customerIsFirstOrder) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This code is limited to a first order." };
  }
  if (discount.minSubtotalMinor !== null && input.subtotalMinor < discount.minSubtotalMinor) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This order does not meet the minimum for this code." };
  }

  const eligibleMinor = input.lines.reduce((sum, line) => {
    return lineEligible(line, discount) ? sum + line.lineTotalMinor : sum;
  }, 0);
  if (eligibleMinor <= 0) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This code does not apply to the items in the cart." };
  }

  if (discount.type === "free_shipping") {
    return { ok: true, discountMinor: 0, freeShipping: true, message: "Free shipping will be applied." };
  }
  if (discount.type === "percentage") {
    const bps = discount.percentageBps ?? 0;
    if (bps <= 0 || bps > 10000) {
      return { ok: false, discountMinor: 0, freeShipping: false, message: "This percentage code is misconfigured." };
    }
    const amount = Math.min(eligibleMinor, roundHalfUpDiv(eligibleMinor * bps, 10000));
    return { ok: true, discountMinor: amount, freeShipping: false, message: "Code applied." };
  }
  if (!input.currency || discount.currency !== input.currency) {
    return { ok: false, discountMinor: 0, freeShipping: false, message: "This code is for a different currency." };
  }
  const fixed = discount.amountMinor ?? 0;
  if (fixed <= 0) return { ok: false, discountMinor: 0, freeShipping: false, message: "This amount code is misconfigured." };
  return { ok: true, discountMinor: Math.min(fixed, eligibleMinor), freeShipping: false, message: "Code applied." };
}

export function quoteShipping(input: {
  method: ShippingMethodQuote;
  countryCode: string;
  weightGrams: number;
  merchandiseAfterDiscountMinor: number;
  allowDemonstration: boolean;
}): { eligible: boolean; amountMinor: number; reason: string | null } {
  const method = input.method;
  if (!method.active) return { eligible: false, amountMinor: 0, reason: "This shipping method is inactive." };
  if (method.isDemonstration && !input.allowDemonstration) {
    return { eligible: false, amountMinor: 0, reason: "Demonstration shipping rates are not available." };
  }
  const countries = method.countries.map((country) => country.toUpperCase());
  if (!countries.includes("*") && !countries.includes(input.countryCode.toUpperCase())) {
    return { eligible: false, amountMinor: 0, reason: "This method does not ship to the selected country." };
  }
  if (method.minWeightGrams !== null && input.weightGrams < method.minWeightGrams) {
    return { eligible: false, amountMinor: 0, reason: "The shipment is below this method's weight range." };
  }
  if (method.maxWeightGrams !== null && input.weightGrams > method.maxWeightGrams) {
    return { eligible: false, amountMinor: 0, reason: "The shipment is above this method's weight range." };
  }
  if (
    method.freeThresholdMinor !== null &&
    input.merchandiseAfterDiscountMinor >= method.freeThresholdMinor
  ) {
    return { eligible: true, amountMinor: 0, reason: null };
  }
  const weightCharge = roundHalfUpDiv(method.perKgMinor * input.weightGrams, 1000);
  return { eligible: true, amountMinor: method.flatMinor + weightCharge, reason: null };
}

function ruleScore(rule: TaxRule, destination: Destination, taxCategory: string): number | null {
  if (!rule.active) return null;
  if (rule.countryCode.toUpperCase() !== destination.countryCode.toUpperCase()) return null;
  if (rule.regionCode && rule.regionCode.toUpperCase() !== (destination.regionCode ?? "").toUpperCase()) return null;
  if (rule.productTaxCategory && rule.productTaxCategory !== taxCategory) return null;
  let score = rule.priority;
  if (rule.regionCode) score += 1_000;
  if (rule.productTaxCategory) score += 10_000;
  return score;
}

export function selectTaxRule(rules: TaxRule[], destination: Destination, taxCategory: string): TaxRule | null {
  let best: { rule: TaxRule; score: number } | null = null;
  for (const rule of rules) {
    const score = ruleScore(rule, destination, taxCategory);
    if (score === null) continue;
    if (!best || score > best.score) best = { rule, score };
  }
  return best?.rule ?? null;
}

export function allocateDiscount(lineTotals: number[], discountMinor: number, eligible: boolean[]): number[] {
  const indexes = eligible.map((value, index) => (value ? index : -1)).filter((index) => index >= 0);
  const result = lineTotals.map(() => 0);
  const eligibleSum = indexes.reduce((sum, index) => sum + lineTotals[index], 0);
  if (discountMinor <= 0 || eligibleSum <= 0) return result;
  let allocated = 0;
  indexes.forEach((index, position) => {
    if (position === indexes.length - 1) {
      result[index] = discountMinor - allocated;
      return;
    }
    const share = roundHalfUpDiv(discountMinor * lineTotals[index], eligibleSum);
    result[index] = share;
    allocated += share;
  });
  return result;
}

export function quoteCart(input: {
  lines: QuoteLine[];
  discount?: DiscountRule | null;
  shippingMethod?: ShippingMethodQuote | null;
  destination?: Destination | null;
  taxRules?: TaxRule[];
  customerIsFirstOrder?: boolean;
  requireShipping?: boolean;
  allowDemonstrationShipping?: boolean;
  now?: Date;
}): Quote {
  const errors: string[] = [];
  const priced = input.lines.map((line) => {
    const qtyError = quantityError(line.quantity);
    if (qtyError) errors.push(qtyError);
    if (line.unitPriceMinor < 0) errors.push("A line has a negative price.");
    let lineTotalMinor = 0;
    if (!qtyError && line.unitPriceMinor >= 0) {
      try {
        lineTotalMinor = mulMinor(line.unitPriceMinor, line.quantity);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Invalid line amount.");
      }
    }
    return { ...line, lineTotalMinor };
  });

  const currencies = [...new Set(priced.map((line) => line.currency))];
  if (currencies.length > 1) errors.push("A cart cannot mix currencies.");
  const currency = currencies[0] ?? null;
  const subtotalMinor = priced.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  const weightGrams = priced.reduce((sum, line) => sum + Math.max(line.weightGrams, 0) * line.quantity, 0);

  if (priced.length === 0) errors.push("Your cart is empty.");

  const decision = evaluateDiscount({
    discount: input.discount ?? null,
    lines: priced,
    subtotalMinor,
    currency,
    customerIsFirstOrder: input.customerIsFirstOrder ?? true,
    now: input.now,
  });
  if (!decision.ok && input.discount) errors.push(decision.message);

  const merchandiseMinor = subtotalMinor - decision.discountMinor;
  let shippingMinor = 0;
  let shippingEstimate: Quote["shippingEstimate"] = null;
  if (input.shippingMethod) {
    if (currency && input.shippingMethod.currency !== currency) {
      errors.push("The shipping method uses a different currency.");
    } else if (!input.destination) {
      errors.push("A destination is required to calculate shipping.");
    } else {
      const quoted = quoteShipping({
        method: input.shippingMethod,
        countryCode: input.destination.countryCode,
        weightGrams,
        merchandiseAfterDiscountMinor: merchandiseMinor,
        allowDemonstration: input.allowDemonstrationShipping ?? false,
      });
      if (!quoted.eligible) errors.push(quoted.reason ?? "Shipping is unavailable.");
      else {
        shippingMinor = decision.freeShipping ? 0 : quoted.amountMinor;
        shippingEstimate = {
          minDays: input.shippingMethod.estimateMinDays,
          maxDays: input.shippingMethod.estimateMaxDays,
        };
      }
    }
  } else if (input.requireShipping) {
    errors.push("Choose a shipping method.");
  }

  const rules = input.taxRules ?? [];
  let taxMinor = 0;
  let taxInclusive = false;
  let taxConfigured = false;
  if (input.destination && priced.length > 0 && rules.length > 0) {
    const eligibleFlags = input.discount
      ? priced.map((line) => lineEligible(line, input.discount as DiscountRule))
      : priced.map(() => true);
    const shares = allocateDiscount(
      priced.map((line) => line.lineTotalMinor),
      decision.discountMinor,
      eligibleFlags,
    );
    const modes = new Set<boolean>();
    priced.forEach((line, index) => {
      const rule = selectTaxRule(rules, input.destination as Destination, line.taxCategory);
      if (!rule) return;
      taxConfigured = true;
      modes.add(rule.inclusive);
      const taxable = Math.max(line.lineTotalMinor - shares[index], 0);
      taxMinor += rule.inclusive
        ? roundHalfUpDiv(taxable * rule.rateBps, 10_000 + rule.rateBps)
        : roundHalfUpDiv(taxable * rule.rateBps, 10_000);
    });
    if (modes.size > 1) errors.push("Tax rules mix inclusive and exclusive prices. An administrator must correct them.");
    taxInclusive = modes.size === 1 ? [...modes][0] : false;
    const shippingRule = rules
      .filter((rule) => rule.appliesToShipping)
      .map((rule) => ({ rule, score: ruleScore(rule, input.destination as Destination, rule.productTaxCategory ?? "") }))
      .filter((entry): entry is { rule: TaxRule; score: number } => entry.score !== null)
      .sort((a, b) => b.score - a.score)[0]?.rule;
    if (shippingRule && shippingMinor > 0 && !shippingRule.inclusive) {
      taxConfigured = true;
      taxMinor += roundHalfUpDiv(shippingMinor * shippingRule.rateBps, 10_000);
    }
  }

  const totalMinor = taxInclusive
    ? merchandiseMinor + shippingMinor
    : merchandiseMinor + shippingMinor + taxMinor;

  return {
    currency,
    lines: priced,
    subtotalMinor,
    discountMinor: decision.discountMinor,
    shippingMinor,
    taxMinor,
    taxInclusive,
    taxConfigured,
    totalMinor,
    freeShipping: decision.freeShipping,
    errors,
    shippingEstimate,
    weightGrams,
  };
}
