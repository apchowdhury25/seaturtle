import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2).max(20),
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/, "Use a two-letter country code."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  email: z.email(),
  shipping: addressSchema,
  billingSame: z.boolean(),
  billing: addressSchema.optional(),
  shippingMethodId: z.uuid(),
  discountCode: z.string().trim().max(40).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  orderReference: z.string().trim().max(40).optional().or(z.literal("")),
  consent: z.literal(true, { error: "Consent is required." }),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  password: z.string().min(10).max(128),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(2).max(64),
  description: z.string().trim().min(1).max(8000),
  shortDescription: z.string().trim().max(300),
  categoryId: z.uuid().optional().or(z.literal("")),
  gender: z.enum(["men", "women", "unisex"]).optional().or(z.literal("")),
  productType: z.string().trim().max(40).optional().or(z.literal("")),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(["draft", "active", "archived"]),
  priceMinor: z.number().int().nonnegative(),
  color: z.string().trim().min(1).max(40),
  size: z.string().trim().min(1).max(20),
  stock: z.number().int().nonnegative(),
  isDemonstration: z.boolean(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
