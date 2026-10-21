"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { formatMinor } from "@/lib/commerce";
import { addToCart, buyNow, toggleWishlist, type ActionState } from "@/server/actions";

type Variant = {
  id: string;
  sku: string;
  color: string;
  hex: string | null;
  size: string;
  priceMinor: number;
  regularMinor: number;
  currency: string;
  available: number;
};

const initial: ActionState = { ok: false, message: "" };

export function ProductPurchase({ productId, variants, underwear }: { productId: string; variants: Variant[]; underwear: boolean }) {
  const colors = [...new Map(variants.map((variant) => [variant.color, variant.hex])).entries()];
  const [color, setColor] = useState(colors[0]?.[0] ?? "");
  const sizes = variants.filter((variant) => variant.color === color);
  const [size, setSize] = useState(sizes[0]?.size ?? "");
  const selected = useMemo(
    () => variants.find((variant) => variant.color === color && variant.size === size) ?? sizes[0],
    [variants, color, size, sizes],
  );
  const [cartState, cartAction, cartPending] = useActionState(addToCart, initial);
  const [buyState, buyAction, buyPending] = useActionState(buyNow, initial);
  const [wishState, wishAction, wishPending] = useActionState(toggleWishlist, initial);
  if (!selected) return <p>No purchasable variant is published.</p>;
  return (
    <div className="grid gap-5">
      <p className="font-display text-3xl text-navy">{formatMinor(selected.priceMinor, selected.currency)}</p>
      {selected.regularMinor > selected.priceMinor ? <p className="text-sm text-muted">Regular {formatMinor(selected.regularMinor, selected.currency)}</p> : null}
      <fieldset>
        <legend className="text-xs tracking-[0.14em] text-muted uppercase">Color</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map(([name, hex]) => (
            <button
              key={name}
              type="button"
              aria-pressed={name === color}
              className={`h-10 border px-3 text-sm ${name === color ? "border-navy" : "border-line"}`}
              onClick={() => {
                setColor(name);
                const next = variants.find((variant) => variant.color === name);
                if (next) setSize(next.size);
              }}
            >
              <span className="mr-2 inline-block h-3 w-3 border border-line align-middle" style={{ background: hex ?? "#d4cdc0" }} aria-hidden />
              {name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-xs tracking-[0.14em] text-muted uppercase">Size</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.map((variant) => (
            <button
              key={variant.id}
              type="button"
              aria-pressed={variant.size === selected.size}
              disabled={variant.available < 1}
              className={`h-10 min-w-12 border px-3 text-sm disabled:line-through ${variant.size === selected.size ? "border-navy bg-navy text-ivory" : "border-line"}`}
              onClick={() => setSize(variant.size)}
            >
              {variant.size}
            </button>
          ))}
        </div>
        <a href="/size-guide" className="mt-2 inline-block text-sm underline">Size guide</a>
      </fieldset>
      <p aria-live="polite" className="text-sm">{selected.available > 0 ? `${selected.available} available` : "Out of stock"} · SKU {selected.sku}</p>
      {underwear ? <p className="text-sm text-muted">Underwear returns follow the hygiene rule in the returns policy, and any stronger right in the customer&apos;s local law.</p> : null}
      <form action={cartAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="variantId" value={selected.id} />
        <label className="text-xs tracking-[0.14em] text-muted uppercase">Quantity
          <input name="quantity" type="number" min={1} max={20} defaultValue={1} className="mt-1 block h-11 w-20 border border-line px-2" />
        </label>
        <button className="h-11 bg-navy px-6 text-sm text-ivory" disabled={cartPending || selected.available < 1}>{cartPending ? "Adding…" : "Add to cart"}</button>
      </form>
      <form action={buyAction}>
        <input type="hidden" name="variantId" value={selected.id} />
        <input type="hidden" name="quantity" value={1} />
        <button className="h-11 border border-navy px-6 text-sm" disabled={buyPending || selected.available < 1}>{buyPending ? "Continuing…" : "Buy now"}</button>
      </form>
      <form action={wishAction}>
        <input type="hidden" name="productId" value={productId} />
        <button className="text-sm underline" disabled={wishPending}>Save to wishlist</button>
      </form>
      {cartState.message ? <p role="status">{cartState.message}</p> : null}
      {buyState.message ? <p role="status">{buyState.message}</p> : null}
      {wishState.message ? <p role="status">{wishState.message}</p> : null}
    </div>
  );
}
