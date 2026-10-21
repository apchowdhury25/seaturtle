import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import QRCode from "qrcode";
import { evidenceLabel } from "@/lib/claims";
import { siteUrl } from "@/lib/env";
import { getPublicTrace } from "@/server/storefront";

async function Trace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getPublicTrace(token);
  if (!record) notFound();
  const url = `${siteUrl()}/trace/${token}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0e2433", light: "#f7f3ec" } });
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs tracking-[0.16em] text-turquoise uppercase">Traceability</p>
      <h1 className="mt-2 font-display text-4xl text-navy">{record.productName ?? "Garment record"}</h1>
      {record.demonstration ? <p className="mt-3 text-xs tracking-wide text-turtle uppercase">Demonstration record. Not a production batch.</p> : null}
      <p className="mt-4 text-sm leading-6">{record.summary || "No public summary has been written."}</p>
      <ol className="mt-8 grid gap-4">
        {record.stages.map((stage) => (
          <li key={stage.stage} className="border-b border-line pb-4">
            <h2 className="font-display text-2xl text-navy">{stage.stage}</h2>
            <p className="text-xs tracking-wide text-turquoise uppercase">{evidenceLabel(stage.evidenceLevel)}</p>
            <p className="mt-2 text-sm">{stage.summary}</p>
            {stage.locationPublic ? <p className="text-sm text-muted">{stage.locationPublic}</p> : null}
          </li>
        ))}
      </ol>
      {record.productSlug ? <Link href={`/products/${record.productSlug}`} className="mt-6 inline-block text-sm underline">View the product</Link> : null}
      <div className="mt-8 max-w-40" dangerouslySetInnerHTML={{ __html: qr }} />
    </article>
  );
}

export default function TracePage({ params }: { params: Promise<{ token: string }> }) {
  return <Suspense fallback={<p className="px-4 py-14">Loading the record…</p>}><Trace params={params} /></Suspense>;
}
