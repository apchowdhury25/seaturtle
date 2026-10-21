export const metadata = { title: "Unavailable", robots: { index: false, follow: false } };

export default function MaintenancePage() {
  return (
    <main id="content" className="mx-auto max-w-xl px-4 py-24">
      <p className="text-xs tracking-[0.18em] text-turquoise uppercase">Sea Turtle Apparel</p>
      <h1 className="mt-3 font-display text-5xl text-navy">The shop is briefly unavailable.</h1>
      <p className="mt-4 text-sm text-muted">Maintenance mode is on. Orders already placed are unchanged. Try again shortly.</p>
    </main>
  );
}
