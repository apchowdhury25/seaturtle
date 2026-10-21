import { RecoverForm } from "@/components/account-forms";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function RecoverPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-navy">Reset password</h1>
      <p className="mt-3 text-sm text-muted">Supabase sends the reset email when Auth email is configured. This page does not confirm that an inbox exists.</p>
      <div className="mt-8"><RecoverForm /></div>
    </section>
  );
}
