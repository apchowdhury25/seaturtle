import { FAQ } from "@/content/pages";

export const metadata = { title: "Frequently Asked Questions" };

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl text-navy">Questions</h1>
      <div className="mt-8 grid gap-6">
        {FAQ.map((item) => (
          <details key={item.q} className="border-b border-line pb-4">
            <summary className="cursor-pointer font-display text-xl text-navy">{item.q}</summary>
            <p className="mt-3 text-sm leading-6">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
