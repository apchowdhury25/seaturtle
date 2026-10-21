"use client";

import { useActionState } from "react";
import { loginAccount, registerAccount, requestPasswordReset, requestPrivacy, saveAddress, saveProfile, sendContact, type ActionState } from "@/server/actions";

const initial: ActionState = { ok: false, message: "" };

function Status({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p role="status" className="text-sm">{state.message}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAccount, initial);
  return (
    <form action={action} className="grid max-w-md gap-3">
      <label className="text-sm">Email<input name="email" type="email" required autoComplete="email" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Password<input name="password" type="password" required autoComplete="current-password" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <Status state={state} />
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAccount, initial);
  return (
    <form action={action} className="grid max-w-md gap-3">
      <label className="text-sm">Full name<input name="fullName" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Email<input name="email" type="email" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Password<input name="password" type="password" required minLength={10} autoComplete="new-password" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
      <Status state={state} />
    </form>
  );
}

export function RecoverForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="grid max-w-md gap-3">
      <label className="text-sm">Email<input name="email" type="email" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>Send reset link</button>
      <Status state={state} />
    </form>
  );
}

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action, pending] = useActionState(saveProfile, initial);
  return (
    <form action={action} className="grid max-w-md gap-3">
      <label className="text-sm">Name<input name="fullName" defaultValue={fullName} className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Phone<input name="phone" defaultValue={phone} className="mt-1 h-11 w-full border border-line px-3" /></label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>Save profile</button>
      <Status state={state} />
    </form>
  );
}

export function AddressForm() {
  const [state, action, pending] = useActionState(saveAddress, initial);
  return (
    <form action={action} className="grid max-w-md gap-3">
      <label className="text-sm">Full name<input name="fullName" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Address<input name="line1" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Line 2<input name="line2" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">City<input name="city" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Region<input name="region" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Postal code<input name="postalCode" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Country<input name="countryCode" required maxLength={2} className="mt-1 h-11 w-full border border-line px-3 uppercase" /></label>
      <label className="text-sm">Phone<input name="phone" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>Save address</button>
      <Status state={state} />
    </form>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, initial);
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <label className="text-sm">Name<input name="name" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Email<input name="email" type="email" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Subject<input name="subject" required className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Order reference, optional<input name="orderReference" className="mt-1 h-11 w-full border border-line px-3" /></label>
      <label className="text-sm">Message<textarea name="message" required minLength={10} className="mt-1 min-h-32 w-full border border-line px-3 py-2" /></label>
      <label className="flex items-start gap-2 text-sm"><input name="consent" type="checkbox" required className="mt-1" /> I understand this message is stored for customer service.</label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
      <Status state={state} />
    </form>
  );
}

export function PrivacyForm() {
  const [state, action, pending] = useActionState(requestPrivacy, initial);
  return (
    <form action={action} className="grid max-w-md gap-3">
      <label className="text-sm">Request
        <select name="requestType" className="mt-1 h-11 w-full border border-line px-2">
          <option value="access">Access</option>
          <option value="correction">Correction</option>
          <option value="export">Export</option>
          <option value="deletion">Deletion</option>
        </select>
      </label>
      <label className="text-sm">Details<textarea name="details" className="mt-1 min-h-24 w-full border border-line px-3 py-2" /></label>
      <button className="h-11 bg-navy text-sm text-ivory" disabled={pending}>Submit request</button>
      <Status state={state} />
    </form>
  );
}
