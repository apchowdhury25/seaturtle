import { describe, expect, it } from "vitest";
import {
  activeUnitPrice,
  allocateDiscount,
  availableToSell,
  evaluateDiscount,
  formatMinor,
  majorToMinor,
  toMajorString,
  quoteCart,
  quoteShipping,
  roundHalfUpDiv,
  selectTaxRule,
  type DiscountRule,
  type QuoteLine,
  type ShippingMethodQuote,
  type TaxRule,
} from "@/lib/commerce";
import { calculateAccrual } from "@/lib/conservation";
import { evidenceLabel, findUnsupportedClaims, toPublicTrace } from "@/lib/claims";
import { hasPermission } from "@/lib/permissions";
import { nextPaymentStatus, paymentAmountsMatch, verifyStripeSignature, verifyTestSignature } from "@/lib/payments";
import { hmacSha256 } from "@/lib/security";
import { parseCsv, toCsv, validateProductImport } from "@/lib/csv";

const line = (overrides: Partial<QuoteLine> = {}): QuoteLine => ({
  variantId: "v1",
  productId: "p1",
  categoryId: "denim",
  quantity: 2,
  unitPriceMinor: 5000,
  currency: "USD",
  weightGrams: 500,
  taxCategory: "apparel",
  name: "Jean",
  sku: "SKU-1",
  ...overrides,
});

const discount = (overrides: Partial<DiscountRule> = {}): DiscountRule => ({
  id: "d1",
  code: "WELCOME10",
  type: "percentage",
  percentageBps: 1000,
  amountMinor: null,
  currency: null,
  minSubtotalMinor: null,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usageCount: 0,
  perCustomerLimit: null,
  customerRedemptions: 0,
  isActive: true,
  productIds: null,
  categoryIds: null,
  firstOrderOnly: false,
  ...overrides,
});

const shipping = (overrides: Partial<ShippingMethodQuote> = {}): ShippingMethodQuote => ({
  id: "s1",
  name: "Standard",
  currency: "USD",
  countries: ["US", "BD"],
  active: true,
  isDemonstration: false,
  flatMinor: 1500,
  freeThresholdMinor: 20000,
  minWeightGrams: null,
  maxWeightGrams: null,
  perKgMinor: 0,
  estimateMinDays: 5,
  estimateMaxDays: 10,
  ...overrides,
});

const tax = (overrides: Partial<TaxRule> = {}): TaxRule => ({
  id: "t1",
  countryCode: "US",
  regionCode: null,
  productTaxCategory: null,
  rateBps: 1000,
  inclusive: false,
  appliesToShipping: false,
  priority: 1,
  active: true,
  ...overrides,
});

describe("money", () => {
  it("rounds half up and formats without floating-point arithmetic", () => {
    expect(roundHalfUpDiv(199 * 1000, 10000)).toBe(20);
    expect(formatMinor(199, "USD")).toBe("USD 1.99");
    expect(formatMinor(5000, "JPY")).toBe("JPY 5000");
    expect(formatMinor(-250, "BDT")).toBe("-BDT 2.50");
    expect(toMajorString(12800, "USD")).toBe("128.00");
    expect(toMajorString(5000, "JPY")).toBe("5000");
    expect(majorToMinor("128.00", "USD")).toBe(12800);
    expect(majorToMinor("10.50", "USD")).toBe(1050);
    expect(majorToMinor("10.555", "USD")).toBeNull();
  });

  it("uses the scheduled sale price only inside the window", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    expect(
      activeUnitPrice({
        regularMinor: 8000,
        saleMinor: 6400,
        saleStartsAt: "2026-04-01T00:00:00Z",
        saleEndsAt: "2026-06-01T00:00:00Z",
        now,
      }),
    ).toBe(6400);
    expect(
      activeUnitPrice({
        regularMinor: 8000,
        saleMinor: 6400,
        saleStartsAt: "2026-06-01T00:00:00Z",
        saleEndsAt: null,
        now,
      }),
    ).toBe(8000);
  });
});

describe("discounts, shipping, and tax", () => {
  it("rejects inactive, expired, limited, currency-mismatched, and too-small orders", () => {
    const lines = [{ ...line(), lineTotalMinor: 9000 }];
    expect(evaluateDiscount({ discount: discount({ isActive: false }), lines, subtotalMinor: 9000, currency: "USD", customerIsFirstOrder: true }).ok).toBe(false);
    expect(
      evaluateDiscount({
        discount: discount({ endsAt: "2020-01-01T00:00:00Z" }),
        lines,
        subtotalMinor: 9000,
        currency: "USD",
        customerIsFirstOrder: true,
        now: new Date("2026-01-01T00:00:00Z"),
      }).message,
    ).toMatch(/dates/);
    expect(
      evaluateDiscount({
        discount: discount({ usageLimit: 1, usageCount: 1 }),
        lines,
        subtotalMinor: 9000,
        currency: "USD",
        customerIsFirstOrder: true,
      }).message,
    ).toMatch(/usage limit/);
    expect(
      evaluateDiscount({
        discount: discount({ type: "fixed_amount", amountMinor: 500, currency: "BDT" }),
        lines,
        subtotalMinor: 9000,
        currency: "USD",
        customerIsFirstOrder: true,
      }).message,
    ).toMatch(/currency/);
    expect(
      evaluateDiscount({
        discount: discount({ minSubtotalMinor: 10000 }),
        lines,
        subtotalMinor: 9999,
        currency: "USD",
        customerIsFirstOrder: true,
      }).ok,
    ).toBe(false);
    expect(
      evaluateDiscount({
        discount: discount({ firstOrderOnly: true }),
        lines,
        subtotalMinor: 9000,
        currency: "USD",
        customerIsFirstOrder: false,
      }).ok,
    ).toBe(false);
  });

  it("caps a fixed discount at the eligible subtotal and restricts categories", () => {
    const lines = [{ ...line({ categoryId: "polos" }), lineTotalMinor: 400 }];
    const decision = evaluateDiscount({
      discount: discount({ type: "fixed_amount", amountMinor: 500, currency: "USD", categoryIds: ["denim"] }),
      lines,
      subtotalMinor: 400,
      currency: "USD",
      customerIsFirstOrder: true,
    });
    expect(decision.ok).toBe(false);
  });

  it("quotes an order total from server-side rules", () => {
    const quote = quoteCart({
      lines: [line()],
      discount: discount(),
      shippingMethod: shipping(),
      destination: { countryCode: "US" },
      taxRules: [tax()],
      requireShipping: true,
    });
    expect(quote.errors).toEqual([]);
    expect(quote.subtotalMinor).toBe(10000);
    expect(quote.discountMinor).toBe(1000);
    expect(quote.shippingMinor).toBe(1500);
    expect(quote.taxMinor).toBe(900);
    expect(quote.totalMinor).toBe(11400);
    expect(quote.taxConfigured).toBe(true);
  });

  it("applies free-shipping thresholds and weight charges", () => {
    expect(
      quoteShipping({
        method: shipping(),
        countryCode: "US",
        weightGrams: 400,
        merchandiseAfterDiscountMinor: 20000,
        allowDemonstration: false,
      }).amountMinor,
    ).toBe(0);
    expect(
      quoteShipping({
        method: shipping({ flatMinor: 500, freeThresholdMinor: null, perKgMinor: 1000, countries: ["BD"] }),
        countryCode: "BD",
        weightGrams: 1500,
        merchandiseAfterDiscountMinor: 1000,
        allowDemonstration: false,
      }).amountMinor,
    ).toBe(2000);
    expect(
      quoteShipping({
        method: shipping({ countries: ["BD"] }),
        countryCode: "US",
        weightGrams: 100,
        merchandiseAfterDiscountMinor: 100,
        allowDemonstration: false,
      }).eligible,
    ).toBe(false);
  });

  it("does not invent a tax when no rule matches and handles inclusive prices", () => {
    const untaxed = quoteCart({
      lines: [line({ quantity: 1, unitPriceMinor: 10000 })],
      destination: { countryCode: "BD" },
      taxRules: [tax()],
    });
    expect(untaxed.taxMinor).toBe(0);
    expect(untaxed.taxConfigured).toBe(false);

    const inclusive = quoteCart({
      lines: [line({ quantity: 1, unitPriceMinor: 11000 })],
      destination: { countryCode: "US", regionCode: "TX" },
      taxRules: [tax({ inclusive: true, regionCode: "TX", rateBps: 1000 })],
    });
    expect(inclusive.taxMinor).toBe(1000);
    expect(inclusive.totalMinor).toBe(11000);
    expect(selectTaxRule([tax(), tax({ id: "t2", regionCode: "TX", rateBps: 800, priority: 1 })], { countryCode: "US", regionCode: "TX" }, "apparel")?.id).toBe("t2");
  });

  it("allocates a discount so the shares add back to the original amount", () => {
    expect(allocateDiscount([5000, 5000], 1000, [true, true])).toEqual([500, 500]);
  });

  it("blocks unavailable stock and invalid quantities", () => {
    expect(availableToSell(5, 3)).toBe(2);
    const quote = quoteCart({ lines: [line({ quantity: 0 }), line({ quantity: -1, variantId: "v2" })] });
    expect(quote.errors.length).toBeGreaterThan(0);
  });
});

describe("conservation and claims", () => {
  it("separates calculated accruals from unpaid, unknown-profit, and manual programs", () => {
    expect(
      calculateAccrual({
        model: "percent_revenue",
        rateBps: 500,
        fixedMinor: null,
        programCurrency: "USD",
        orderCurrency: "USD",
        netMerchandiseMinor: 20000,
        knownProfitMinor: null,
        qualifyingItemCount: 1,
        orderStatus: "paid",
        eligibleStatuses: ["paid"],
        active: true,
      }).amountMinor,
    ).toBe(1000);
    expect(
      calculateAccrual({
        model: "percent_profit",
        rateBps: 1000,
        fixedMinor: null,
        programCurrency: "USD",
        orderCurrency: "USD",
        netMerchandiseMinor: 20000,
        knownProfitMinor: null,
        qualifyingItemCount: 1,
        orderStatus: "paid",
        eligibleStatuses: ["paid"],
        active: true,
      }).status,
    ).toBe("blocked");
    expect(
      calculateAccrual({
        model: "fixed_per_item",
        rateBps: null,
        fixedMinor: 100,
        programCurrency: "USD",
        orderCurrency: "USD",
        netMerchandiseMinor: 0,
        knownProfitMinor: null,
        qualifyingItemCount: 3,
        orderStatus: "paid",
        eligibleStatuses: ["paid"],
        active: true,
      }).amountMinor,
    ).toBe(300);
    expect(
      calculateAccrual({
        model: "manual",
        rateBps: null,
        fixedMinor: null,
        programCurrency: "USD",
        orderCurrency: "USD",
        netMerchandiseMinor: 5000,
        knownProfitMinor: null,
        qualifyingItemCount: 1,
        orderStatus: "pending_payment",
        eligibleStatuses: ["paid"],
        active: true,
      }).status,
    ).toBe("ineligible");
  });

  it("flags unsupported environmental claims and strips private trace fields", () => {
    expect(findUnsupportedClaims("This fiber is carbon neutral and ocean safe.")).toHaveLength(2);
    expect(findUnsupportedClaims("Responsibly sourced cotton.")).toEqual([]);
    expect(evidenceLabel("planned")).toMatch(/Planned/);
    expect(toPublicTrace([{ stage: "Mill", summary: "Secret", evidenceLevel: "supplier_reported", price: 10 }])).toEqual([]);
    expect(toPublicTrace([{ stage: "Mill", summary: "Supplier named the country.", evidenceLevel: "supplier_reported" }])).toHaveLength(1);
  });
});

describe("payments, permissions, and csv", () => {
  it("verifies Stripe signatures and rejects tampering, expiry, and amount mismatches", () => {
    const payload = JSON.stringify({ id: "evt_1", amount: 11400 });
    const secret = "whsec_test";
    const timestamp = "1700000000";
    const signature = hmacSha256(secret, `${timestamp}.${payload}`);
    const header = `t=${timestamp},v1=${signature}`;
    expect(verifyStripeSignature(payload, header, secret, 300, 1700000000 * 1000).ok).toBe(true);
    expect(verifyStripeSignature(payload, header, "other", 300, 1700000000 * 1000).ok).toBe(false);
    expect(verifyStripeSignature(`${payload}x`, header, secret, 300, 1700000000 * 1000).ok).toBe(false);
    expect(verifyStripeSignature(payload, header, secret, 300, 1700000401 * 1000).ok).toBe(false);
    expect(verifyTestSignature(payload, hmacSha256("sandbox", payload), "sandbox").ok).toBe(true);
    expect(paymentAmountsMatch({ totalMinor: 11400, currency: "usd" }, { amountMinor: 11400, currency: "USD" })).toBe(true);
    expect(paymentAmountsMatch({ totalMinor: 11400, currency: "USD" }, { amountMinor: 100, currency: "USD" })).toBe(false);
  });

  it("makes payment transitions idempotent and blocks illegal moves", () => {
    expect(nextPaymentStatus("pending", "paid", true).type).toBe("duplicate");
    expect(nextPaymentStatus("pending", "paid", false)).toEqual({ type: "apply", status: "paid" });
    expect(nextPaymentStatus("paid", "paid", false).type).toBe("ignore");
    expect(nextPaymentStatus("failed", "paid", false).type).toBe("reject");
    expect(nextPaymentStatus("paid", "refunded", false)).toEqual({ type: "apply", status: "refunded" });
  });

  it("enforces role permissions on the server map", () => {
    expect(hasPermission(["auditor"], "orders.write")).toBe(false);
    expect(hasPermission(["auditor"], "orders.read")).toBe(true);
    expect(hasPermission(["customer_support"], "conservation.write")).toBe(false);
    expect(hasPermission(["owner"], "staff.manage")).toBe(true);
    expect(hasPermission(["administrator"], "staff.manage")).toBe(false);
    expect(hasPermission(["sustainability_manager"], "sustainability.write")).toBe(true);
  });

  it("reports row-level import errors and preserves quoted commas", () => {
    const csv = toCsv([
      ["name", "slug", "sku", "description", "price_minor", "currency", "category_slug", "color", "size", "stock", "status"],
      ["Indigo Jean", "indigo-jean", "SKU-1", "A jean, indigo", "12800", "USD", "mens-jeans", "Indigo", "32", "4", "draft"],
      ["Copy", "copy", "SKU-1", "", "1000", "USD", "mens-jeans", "Indigo", "32", "1", "draft"],
      ["Bad", "bad", "SKU-2", "", "-1", "US", "mens-jeans", "Indigo", "32", "1", "draft"],
    ]);
    expect(parseCsv(csv)[1][3]).toBe("A jean, indigo");
    const result = validateProductImport(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((issue) => /Duplicate SKU/.test(issue.message))).toBe(true);
  });
});
