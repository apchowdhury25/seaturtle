import Link from "next/link";
import { Suspense } from "react";
import { PrivacyForm, ProfileForm } from "@/components/account-forms";
import { logoutAccount } from "@/server/actions";
import { getSessionProfile } from "@/server/data";

export const metadata = { title: "Account", robots: { index: false, follow: false } };

async function AccountBody() {
  const profile = await getSessionProfile();
  if (!profile) {
    return (
      <div className="grid gap-3">
        <p>Sign in to see orders, addresses, and saved pieces.</p>
        <Link href="/account/login" className="underline">Sign in</Link>
        <Link href="/account/register" className="underline">Create an account</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-8">
      <p className="text-sm">{profile.email}{profile.roles.length ? ` · ${profile.roles.join(", ")}` : ""}</p>
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/account/orders">Orders</Link>
        <Link href="/account/addresses">Addresses</Link>
        <Link href="/account/wishlist">Wishlist</Link>
        {profile.roles.length ? <Link href="/admin">Staff desk</Link> : null}
      </nav>
      <ProfileForm fullName={profile.fullName} phone={profile.phone} />
      <PrivacyForm />
      <form action={logoutAccount}><button className="text-sm underline">Sign out</button></form>
    </div>
  );
}

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Account</h1>
      <div className="mt-8">
        <Suspense fallback={<p>Loading your account…</p>}>
          <AccountBody />
        </Suspense>
      </div>
    </section>
  );
}
