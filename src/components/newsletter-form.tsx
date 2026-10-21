"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type ActionState } from "@/server/actions";

const initial: ActionState = { ok: false, message: "" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <p className="font-display text-2xl">Notes from the house</p>
      <p className="text-sm text-sand">New collections, care advice, sustainability updates, and conservation news. We ask you to confirm the address before it is subscribed.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">Email</label>
        <input id="newsletter-email" name="email" type="email" required autoComplete="email" className="h-11 flex-1 border border-white/20 bg-white px-3 text-charcoal" />
        <button className="h-11 bg-ivory px-5 text-sm text-navy" disabled={pending}>{pending ? "Saving…" : "Request notes"}</button>
      </div>
      <label className="flex items-start gap-2 text-sm text-sand">
        <input name="consent" type="checkbox" className="mt-1" required />
        I agree to receive these emails and I can unsubscribe later.
      </label>
      {state.message ? <p role="status" className="text-sm text-ivory">{state.message}</p> : null}
    </form>
  );
}
