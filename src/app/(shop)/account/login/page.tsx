import Link from "next/link";
import { LoginForm } from "@/components/account-forms";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Sign in</h1>
      <div className="mt-8"><LoginForm /></div>
      <p className="mt-6 text-sm"><Link href="/account/register" className="underline">Create an account</Link> · <Link href="/account/recover" className="underline">Forgot password</Link></p>
    </section>
  );
}
