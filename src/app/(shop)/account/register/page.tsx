import Link from "next/link";
import { RegisterForm } from "@/components/account-forms";

export const metadata = { title: "Create account", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Create an account</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">There is no public staff registration. Customer accounts do not grant admin access.</p>
      <div className="mt-8"><RegisterForm /></div>
      <p className="mt-6 text-sm"><Link href="/account/login" className="underline">Already have an account</Link></p>
    </section>
  );
}
