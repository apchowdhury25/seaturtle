import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section className="max-w-xl py-8">
      <p className="text-xs tracking-[0.18em] text-turquoise uppercase">404</p>
      <h1 className="mt-2 font-display text-4xl text-navy">That record is not on the desk.</h1>
      <p className="mt-4 text-sm text-muted">The order, invoice, or section does not exist for this account.</p>
      <Link href="/admin" className="mt-6 inline-block underline">Back to the desk</Link>
    </section>
  );
}
