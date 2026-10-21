"use client";

import { useActionState, useState } from "react";
import { placeOrder, quotePreview, updateCartItem, type ActionState } from "@/server/actions";

const initial: ActionState = { ok: false, message: "" };

export function CartQuantityForm({ variantId, quantity }: { variantId: string; quantity: number }) {
  const [state, action, pending] = useActionState(updateCartItem, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <label className="sr-only" htmlFor={`qty-${variantId}`}>Quantity</label>
      <input id={`qty-${variantId}`} name="quantity" type="number" min={0} max={20} defaultValue={quantity} className="h-10 w-16 border border-line px-2" />
      <button className="h-10 border border-navy px-3 text-sm" disabled={pending}>Update</button>
      <button className="h-10 px-2 text-sm underline" name="quantity" value="0">Remove</button>
      {state.message ? <span role="status" className="text-sm">{state.message}</span> : null}
    </form>
  );
}

export function CheckoutForm({
  methods,
  emailDefault,
  idempotency,
  providers,
}: {
  methods: Array<{ id: string; name: string; currency: string }>;
  emailDefault: string;
  idempotency: string;
  providers: Array<{ id: string; label: string; mode: string }>;
}) {
  const [state, action, pending] = useActionState(placeOrder, initial);
  const [quote, quoteAction, quotePending] = useActionState(quotePreview, initial);
  const [billingSame, setBillingSame] = useState(true);
  return (
    <form action={action} className="grid gap-8">
      <input type="hidden" name="idempotency" value={idempotency} />
      <fieldset className="grid gap-3">
        <legend className="font-display text-2xl text-navy">Contact</legend>
        <label className="text-sm">Email
          <input name="email" type="email" required autoComplete="email" defaultValue={emailDefault} className="mt-1 h-11 w-full border border-line px-3" />
        </label>
      </fieldset>
      <AddressFields prefix="shipping" legend="Shipping address" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="billingSame" defaultChecked onChange={(event) => setBillingSame(event.target.checked)} />
        Billing address is the same as shipping
      </label>
      {billingSame ? null : <AddressFields prefix="billing" legend="Billing address" />}
      <fieldset className="grid gap-2">
        <legend className="font-display text-2xl text-navy">Shipping method</legend>
        {methods.length === 0 ? <p className="text-sm">No shipping method is configured for checkout.</p> : methods.map((method) => (
          <label key={method.id} className="flex items-center gap-2 text-sm">
            <input type="radio" name="shippingMethodId" value={method.id} required />
            {method.name} <span className="text-muted">({method.currency})</span>
          </label>
        ))}
      </fieldset>
      <label className="text-sm">Discount code
        <input name="discountCode" className="mt-1 h-11 w-full border border-line px-3 uppercase" />
      </label>
      <label className="text-sm">Order note
        <textarea name="note" className="mt-1 min-h-20 w-full border border-line px-3 py-2" />
      </label>
      <fieldset className="grid gap-2">
        <legend className="font-display text-2xl text-navy">Payment</legend>
        {providers.length === 0 ? <p className="text-sm">No payment provider is configured. The order cannot be paid until test or live credentials are added.</p> : providers.map((provider, index) => (
          <label key={provider.id} className="flex items-center gap-2 text-sm">
            <input type="radio" name="provider" value={provider.id} defaultChecked={index === 0} />
            {provider.label} <span className="text-muted">({provider.mode})</span>
          </label>
        ))}
        <p className="text-sm text-muted">Card numbers are entered on the provider&apos;s page. Returning here does not mark an order paid.</p>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button formAction={quoteAction} className="h-11 border border-navy px-5 text-sm" disabled={quotePending}>{quotePending ? "Calculating…" : "Calculate total"}</button>
        <button className="h-11 bg-navy px-5 text-sm text-ivory" disabled={pending || providers.length === 0 || methods.length === 0}>{pending ? "Placing order…" : "Place order and continue to payment"}</button>
      </div>
      {quote.message ? <p role="status">{quote.message}</p> : null}
      {state.message ? <p role="alert">{state.message}</p> : null}
      {state.fieldErrors ? <ul className="text-sm text-turtle">{Object.entries(state.fieldErrors).map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul> : null}
    </form>
  );
}

function AddressFields({ prefix, legend }: { prefix: "shipping" | "billing"; legend: string }) {
  const name = (field: string) => (prefix === "shipping" ? `shipping${field}` : `billing${field}`);
  return (
    <fieldset className="grid gap-3 md:grid-cols-2">
      <legend className="font-display text-2xl text-navy md:col-span-2">{legend}</legend>
      <label className="text-sm md:col-span-2">Full name<input name={name("Name")} required autoComplete="name" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm md:col-span-2">Address<input name={name("Line1")} required autoComplete="address-line1" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm md:col-span-2">Apartment, optional<input name={name("Line2")} autoComplete="address-line2" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">City<input name={name("City")} required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Region<input name={name("Region")} className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Postal code<input name={name("Postal")} required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Country code<input name={name("Country")} required maxLength={2} placeholder="BD" className="mt-1 h-11 w-full border border-line px-3 uppercase" /></label>
      <label className="text-sm md:col-span-2">Phone, optional<input name={name("Phone")} className="mt-1 h-11 w-full border border-line px-3" /></label>
    </fieldset>
  );
}
