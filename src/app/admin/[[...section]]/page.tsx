import Link from "next/link";
import { Suspense } from "react";
import { formatMinor } from "@/lib/commerce";
import { configurationReport } from "@/lib/env";
import { hasPermission } from "@/lib/permissions";
import {
  addShipment, assignRole, cancelOrder, importProducts, publishTrace, recordContributionPayment,
  recordRefund, replyTicket, saveAnnouncement, saveDiscount, saveFacility, savePage, saveProduct,
  saveProgram, saveShipping, saveSupplier, saveTax,
} from "@/server/admin-actions";
import { getSessionProfile } from "@/server/data";
import { createSessionClient } from "@/server/supabase";

export const metadata = { title: "Administration", robots: { index: false, follow: false } };

function Notice({ notice }: { notice?: string }) {
  if (!notice) return null;
  return <p role="status" className="mb-4 border border-line bg-white p-3 text-sm">{notice}</p>;
}

async function Desk({ section, notice }: { section: string; notice?: string }) {
  const profile = await getSessionProfile();
  if (!profile || profile.roles.length === 0) {
    return (
      <section>
        <h1 className="font-display text-4xl text-navy">Staff desk</h1>
        <p className="mt-4">This desk is for authorized staff. There is no public administrator registration. Ask the owner to grant a role with the bootstrap script, then <Link href="/account/login" className="underline">sign in</Link>.</p>
      </section>
    );
  }
  const supabase = await createSessionClient();
  if (!supabase) return <p>Supabase is not configured, so the desk cannot read records.</p>;
  return (
    <div>
      <Notice notice={notice} />
      {section === "" ? <Overview supabase={supabase} roles={profile.roles} /> : null}
      {section === "products" ? <Products supabase={supabase} roles={profile.roles} /> : null}
      {section === "orders" ? <Orders supabase={supabase} roles={profile.roles} /> : null}
      {section === "discounts" ? <Discounts supabase={supabase} roles={profile.roles} /> : null}
      {section === "shipping" ? <Shipping supabase={supabase} roles={profile.roles} /> : null}
      {section === "tax" ? <Tax supabase={supabase} roles={profile.roles} /> : null}
      {section === "content" ? <Content roles={profile.roles} /> : null}
      {section === "support" ? <Support supabase={supabase} roles={profile.roles} /> : null}
      {section === "suppliers" ? <Suppliers supabase={supabase} roles={profile.roles} /> : null}
      {section === "trace" ? <Trace roles={profile.roles} /> : null}
      {section === "conservation" ? <Conservation supabase={supabase} roles={profile.roles} /> : null}
      {section === "staff" ? <Staff roles={profile.roles} /> : null}
      {section === "audit" ? <Audit supabase={supabase} roles={profile.roles} /> : null}
    </div>
  );
}

type Client = NonNullable<Awaited<ReturnType<typeof createSessionClient>>>;

async function Overview({ supabase, roles }: { supabase: Client; roles: string[] }) {
  if (!hasPermission(roles, "analytics.read") && !hasPermission(roles, "orders.read")) {
    return <p>Your role can sign in, but this overview is limited to people who can read orders or analytics.</p>;
  }
  const { data: orders } = await supabase.from("orders").select("status, total_minor, currency, created_at").order("created_at", { ascending: false }).limit(200);
  const rows = orders ?? [];
  const paidStatuses = new Set(["paid", "partially_fulfilled", "fulfilled", "partially_refunded"]);
  const paid = rows.filter((row) => paidStatuses.has(String(row.status)));
  const pending = rows.filter((row) => row.status === "pending_payment");
  const refunded = rows.filter((row) => row.status === "refunded" || row.status === "partially_refunded");
  const currency = String(paid[0]?.currency ?? rows[0]?.currency ?? "USD");
  const gross = paid.reduce((sum, row) => sum + Number(row.total_minor), 0);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">These figures count stored orders in the latest 200 records. Pending and failed payments are not treated as sales. This is an operational view, not statutory accounts.</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-line bg-white p-4"><dt className="text-xs uppercase tracking-wide text-muted">Paid gross</dt><dd className="font-display text-2xl">{rows.length ? formatMinor(gross, currency) : "No sales yet"}</dd></div>
        <div className="border border-line bg-white p-4"><dt className="text-xs uppercase tracking-wide text-muted">Pending payment</dt><dd className="font-display text-2xl">{pending.length}</dd></div>
        <div className="border border-line bg-white p-4"><dt className="text-xs uppercase tracking-wide text-muted">Refunded records</dt><dd className="font-display text-2xl">{refunded.length}</dd></div>
      </dl>
      <ul className="mt-8 text-sm">
        {configurationReport().map((item) => <li key={item.service}>{item.service}: {item.status}. {item.detail}</li>)}
      </ul>
    </section>
  );
}

async function Products({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("products").select("id, name, slug, status, is_demonstration, currency").order("created_at", { ascending: false }).limit(30);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Products</h1>
      <p className="mt-2 text-sm"><Link href="/admin/export/products" className="underline">Export CSV</Link></p>
      <ul className="mt-4 grid gap-2 text-sm">{(data ?? []).map((row) => <li key={row.id}>{row.name} · {row.status}{row.is_demonstration ? " · demonstration" : ""} · <Link href={`/products/${row.slug}`}>preview</Link></li>)}{(data ?? []).length === 0 ? <li>No products are visible to this role.</li> : null}</ul>
      {hasPermission(roles, "catalog.write") ? (
        <div className="mt-8 grid gap-8">
          <form action={saveProduct} className="grid gap-2">
            <h2 className="font-display text-2xl">New product</h2>
            <input name="name" required placeholder="Name" className="h-10 border border-line px-2" />
            <input name="slug" required placeholder="slug" className="h-10 border border-line px-2" />
            <input name="sku" required placeholder="SKU" className="h-10 border border-line px-2" />
            <textarea name="description" required placeholder="Description" className="min-h-24 border border-line px-2" />
            <input name="shortDescription" placeholder="Short description" className="h-10 border border-line px-2" />
            <input name="categoryId" placeholder="Category id, optional" className="h-10 border border-line px-2" />
            <input name="gender" placeholder="men, women, or unisex" className="h-10 border border-line px-2" />
            <input name="productType" placeholder="jeans, polo, dress" className="h-10 border border-line px-2" />
            <input name="currency" defaultValue="USD" className="h-10 border border-line px-2" />
            <select name="status" className="h-10 border border-line px-2"><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select>
            <input name="priceMinor" type="number" required placeholder="Price in minor units" className="h-10 border border-line px-2" />
            <input name="color" required placeholder="Color" className="h-10 border border-line px-2" />
            <input name="size" required placeholder="Size" className="h-10 border border-line px-2" />
            <input name="stock" type="number" required placeholder="Stock" className="h-10 border border-line px-2" />
            <input name="weightGrams" type="number" placeholder="Weight grams" className="h-10 border border-line px-2" />
            <input name="sustainability" placeholder="Sustainability note. Leave claims unverified." className="h-10 border border-line px-2" />
            <label className="text-sm"><input name="isDemonstration" type="checkbox" /> Demonstration record</label>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
            <input name="alt" placeholder="Image alt text" className="h-10 border border-line px-2" />
            <button className="h-10 bg-navy text-sm text-ivory">Save product</button>
          </form>
          <form action={importProducts} className="grid gap-2">
            <h2 className="font-display text-2xl">CSV import</h2>
            <p className="text-sm text-muted">Required headers: name, slug, sku, description, price_minor, currency, category_slug, color, size, stock. Imports are saved as draft demonstration products.</p>
            <textarea name="csv" className="min-h-32 border border-line px-2 font-mono text-xs" />
            <button className="h-10 bg-navy text-sm text-ivory">Validate and import</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

async function Orders({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("orders").select("id, order_number, email, status, total_minor, currency, created_at").order("created_at", { ascending: false }).limit(40);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Orders</h1>
      <ul className="mt-4 grid gap-4 text-sm">
        {(data ?? []).map((order) => (
          <li key={order.id} className="border border-line bg-white p-3">
            <p>{order.order_number} · {order.status} · {formatMinor(Number(order.total_minor), String(order.currency))} · {order.email}</p>
            <p><Link href={`/admin/orders/${order.id}/invoice`} className="underline">Invoice</Link></p>
            {hasPermission(roles, "orders.write") ? (
              <form action={addShipment} className="mt-2 flex flex-wrap gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="carrier" placeholder="Carrier" className="h-9 border border-line px-2" />
                <input name="trackingNumber" placeholder="Tracking number" className="h-9 border border-line px-2" />
                <button className="h-9 border border-navy px-3">Record shipment</button>
              </form>
            ) : null}
            {hasPermission(roles, "orders.write") ? (
              <form action={cancelOrder} className="mt-2"><input type="hidden" name="orderId" value={order.id} /><button className="text-sm underline">Cancel if unpaid</button></form>
            ) : null}
            {hasPermission(roles, "orders.refund") ? (
              <form action={recordRefund} className="mt-2 grid gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="provider" placeholder="Provider id" className="h-9 border border-line px-2" />
                <input name="providerReference" placeholder="Provider refund reference" className="h-9 border border-line px-2" />
                <input name="amountMinor" type="number" placeholder="Amount in minor units" className="h-9 border border-line px-2" />
                <input name="reason" placeholder="Reason" className="h-9 border border-line px-2" />
                <label className="text-xs"><input type="checkbox" name="confirmed" /> I confirmed this refund in the payment provider.</label>
                <button className="h-9 bg-navy text-ivory">Record refund</button>
              </form>
            ) : null}
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No orders yet.</li> : null}
      </ul>
    </section>
  );
}

async function Discounts({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("discounts").select("code, type, is_active, is_demonstration").limit(30);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Discounts</h1>
      <ul className="mt-4 text-sm">{(data ?? []).map((row) => <li key={row.code}>{row.code} · {row.type}{row.is_demonstration ? " · demonstration" : ""}{row.is_active ? "" : " · inactive"}</li>)}</ul>
      {hasPermission(roles, "discounts.write") ? (
        <form action={saveDiscount} className="mt-6 grid max-w-md gap-2">
          <input name="code" required placeholder="Code" className="h-10 border border-line px-2" />
          <select name="type" className="h-10 border border-line px-2"><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option><option value="free_shipping">Free shipping</option></select>
          <input name="percentageBps" type="number" placeholder="Basis points, 1000 = 10%" className="h-10 border border-line px-2" />
          <input name="amountMinor" type="number" placeholder="Fixed minor units" className="h-10 border border-line px-2" />
          <input name="currency" defaultValue="USD" className="h-10 border border-line px-2" />
          <input name="minSubtotal" type="number" placeholder="Minimum subtotal minor units" className="h-10 border border-line px-2" />
          <label className="text-sm"><input name="isActive" type="checkbox" /> Active</label>
          <label className="text-sm"><input name="isDemonstration" type="checkbox" /> Demonstration</label>
          <button className="h-10 bg-navy text-sm text-ivory">Save discount</button>
        </form>
      ) : null}
    </section>
  );
}

async function Shipping({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("shipping_methods").select("name, currency, flat_minor, is_active, is_demonstration").limit(30);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Shipping</h1>
      <ul className="mt-4 text-sm">{(data ?? []).map((row) => <li key={row.name}>{row.name} · {formatMinor(Number(row.flat_minor), String(row.currency))}{row.is_demonstration ? " · demonstration" : ""}</li>)}</ul>
      {hasPermission(roles, "shipping.write") ? (
        <form action={saveShipping} className="mt-6 grid max-w-md gap-2">
          <input name="name" required placeholder="Method name" className="h-10 border border-line px-2" />
          <input name="countries" required placeholder="BD, US" className="h-10 border border-line px-2" />
          <input name="currency" defaultValue="USD" className="h-10 border border-line px-2" />
          <input name="flatMinor" type="number" placeholder="Flat minor units" className="h-10 border border-line px-2" />
          <input name="freeThreshold" type="number" placeholder="Free over minor units" className="h-10 border border-line px-2" />
          <input name="perKgMinor" type="number" placeholder="Per kg minor units" className="h-10 border border-line px-2" />
          <input name="minDays" type="number" placeholder="Minimum days, optional" className="h-10 border border-line px-2" />
          <input name="maxDays" type="number" placeholder="Maximum days, optional" className="h-10 border border-line px-2" />
          <label className="text-sm"><input name="isActive" type="checkbox" /> Active</label>
          <label className="text-sm"><input name="isDemonstration" type="checkbox" /> Demonstration</label>
          <button className="h-10 bg-navy text-sm text-ivory">Save method</button>
        </form>
      ) : null}
    </section>
  );
}

async function Tax({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("tax_rules").select("country_code, rate_bps, inclusive, is_active").limit(30);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Tax</h1>
      <p className="mt-2 text-sm text-muted">Rules are explicit and destination-based. They are not a completed tax filing system.</p>
      <ul className="mt-4 text-sm">{(data ?? []).map((row) => <li key={`${row.country_code}-${row.rate_bps}`}>{row.country_code} · {row.rate_bps} bps{row.inclusive ? " · inclusive" : ""}</li>)}</ul>
      {hasPermission(roles, "settings.write") ? (
        <form action={saveTax} className="mt-6 grid max-w-md gap-2">
          <input name="country" required maxLength={2} placeholder="Country" className="h-10 border border-line px-2" />
          <input name="region" placeholder="Region, optional" className="h-10 border border-line px-2" />
          <input name="rateBps" type="number" required placeholder="Rate in basis points" className="h-10 border border-line px-2" />
          <label className="text-sm"><input name="inclusive" type="checkbox" /> Prices include tax</label>
          <label className="text-sm"><input name="shipping" type="checkbox" /> Apply to shipping</label>
          <label className="text-sm"><input name="isActive" type="checkbox" /> Active</label>
          <button className="h-10 bg-navy text-sm text-ivory">Save rule</button>
        </form>
      ) : null}
    </section>
  );
}

async function Content({ roles }: { roles: string[] }) {
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Content</h1>
      {hasPermission(roles, "content.write") ? (
        <div className="mt-6 grid gap-8">
          <form action={saveAnnouncement} className="grid max-w-xl gap-2">
            <h2 className="font-display text-2xl">Announcement</h2>
            <input name="message" required placeholder="Message" className="h-10 border border-line px-2" />
            <label className="text-sm"><input name="isActive" type="checkbox" /> Active</label>
            <button className="h-10 bg-navy text-sm text-ivory">Save announcement</button>
          </form>
          <form action={savePage} className="grid max-w-xl gap-2">
            <h2 className="font-display text-2xl">Page</h2>
            <input name="slug" required placeholder="slug" className="h-10 border border-line px-2" />
            <input name="title" required placeholder="Title" className="h-10 border border-line px-2" />
            <input name="description" placeholder="Description" className="h-10 border border-line px-2" />
            <textarea name="body" className="min-h-32 border border-line px-2" />
            <select name="status" className="h-10 border border-line px-2"><option value="draft">Draft</option><option value="published">Published</option></select>
            <button className="h-10 bg-navy text-sm text-ivory">Save page</button>
          </form>
        </div>
      ) : <p className="mt-4 text-sm">Your role cannot edit content.</p>}
    </section>
  );
}

async function Support({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("support_tickets").select("id, subject, status, requester_email").order("created_at", { ascending: false }).limit(30);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Support</h1>
      <ul className="mt-4 grid gap-4 text-sm">
        {(data ?? []).map((ticket) => (
          <li key={ticket.id} className="border border-line p-3">
            <p>{ticket.subject} · {ticket.status} · {ticket.requester_email}</p>
            {hasPermission(roles, "support.write") ? (
              <form action={replyTicket} className="mt-2 grid gap-2">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <textarea name="body" required className="min-h-20 border border-line px-2" />
                <select name="status" className="h-9 border border-line px-2"><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
                <button className="h-9 bg-navy text-ivory">Store reply</button>
              </form>
            ) : null}
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No tickets are visible.</li> : null}
      </ul>
    </section>
  );
}

async function Suppliers({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data } = await supabase.from("suppliers").select("public_name, status, is_public, is_demonstration").limit(30);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Suppliers and facilities</h1>
      <ul className="mt-4 text-sm">{(data ?? []).map((row) => <li key={row.public_name}>{row.public_name} · {row.status}{row.is_public ? " · public" : " · private"}{row.is_demonstration ? " · demonstration" : ""}</li>)}</ul>
      {hasPermission(roles, "sustainability.write") ? (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <form action={saveSupplier} className="grid gap-2">
            <h2 className="font-display text-2xl">Supplier</h2>
            <input name="name" required placeholder="Public name" className="h-10 border border-line px-2" />
            <input name="country" maxLength={2} placeholder="Country" className="h-10 border border-line px-2" />
            <select name="status" className="h-10 border border-line px-2"><option value="pending">Pending</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="conditional">Conditional</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></select>
            <textarea name="summary" className="min-h-20 border border-line px-2" />
            <label className="text-sm"><input name="isPublic" type="checkbox" /> Public, approved suppliers only</label>
            <label className="text-sm"><input name="isDemonstration" type="checkbox" /> Demonstration</label>
            <button className="h-10 bg-navy text-sm text-ivory">Save supplier</button>
          </form>
          <form action={saveFacility} className="grid gap-2">
            <h2 className="font-display text-2xl">Facility</h2>
            <input name="name" required placeholder="Facility name" className="h-10 border border-line px-2" />
            <input name="city" placeholder="City" className="h-10 border border-line px-2" />
            <input name="country" maxLength={2} placeholder="Country" className="h-10 border border-line px-2" />
            <select name="status" className="h-10 border border-line px-2"><option value="planned">Planned</option><option value="under_review">Under review</option><option value="operating">Operating</option><option value="suspended">Suspended</option></select>
            <textarea name="summary" placeholder="Do not claim a certification that is not on file." className="min-h-20 border border-line px-2" />
            <label className="text-sm"><input name="isDemonstration" type="checkbox" /> Demonstration</label>
            <button className="h-10 bg-navy text-sm text-ivory">Save facility</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

async function Trace({ roles }: { roles: string[] }) {
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Traceability</h1>
      <p className="mt-2 text-sm text-muted">Public pages show only published, non-demonstration records, and they strip private fields.</p>
      {hasPermission(roles, "sustainability.write") ? (
        <form action={publishTrace} className="mt-6 grid max-w-xl gap-2">
          <input name="productId" placeholder="Product id, optional" className="h-10 border border-line px-2" />
          <textarea name="summary" placeholder="Public summary" className="min-h-20 border border-line px-2" />
          <textarea name="stages" defaultValue='[{"stage":"Raw material","summary":"Not yet available.","evidenceLevel":"unavailable"}]' className="min-h-32 border border-line px-2 font-mono text-xs" />
          <label className="text-sm"><input name="isPublished" type="checkbox" /> Publish</label>
          <label className="text-sm"><input name="isDemonstration" type="checkbox" /> Demonstration</label>
          <button className="h-10 bg-navy text-sm text-ivory">Save trace</button>
        </form>
      ) : <p className="mt-4 text-sm">Your role cannot publish trace records.</p>}
    </section>
  );
}

async function Conservation({ supabase, roles }: { supabase: Client; roles: string[] }) {
  const { data: programs } = await supabase.from("conservation_programs").select("id, name, model, is_active, is_public").limit(20);
  const { data: payments } = await supabase.from("conservation_payments").select("amount_minor, currency, paid_on, approval_status, is_public").order("paid_on", { ascending: false }).limit(20);
  const accrued = await supabase.from("conservation_accruals").select("amount_minor, status").limit(50);
  const accruedTotal = (accrued.data ?? []).reduce((sum, row) => sum + Number(row.amount_minor), 0);
  const paidTotal = (payments ?? []).filter((row) => row.approval_status === "approved").reduce((sum, row) => sum + Number(row.amount_minor), 0);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Conservation</h1>
      <p className="mt-2 text-sm">Accrued in this sample: {formatMinor(accruedTotal, "USD")}. Approved payments in this sample: {formatMinor(paidTotal, String(payments?.[0]?.currency ?? "USD"))}. These are separate numbers.</p>
      <ul className="mt-4 text-sm">{(programs ?? []).map((program) => <li key={program.id}>{program.name} · {program.model}{program.is_active ? " · active" : " · inactive"}{program.is_public ? " · public" : " · private"}</li>)}</ul>
      {hasPermission(roles, "conservation.write") ? (
        <div className="mt-6 grid gap-6">
          <form action={saveProgram} className="grid max-w-md gap-2">
            <select name="model" className="h-10 border border-line px-2"><option value="percent_revenue">Percent of merchandise</option><option value="percent_profit">Percent of recorded profit</option><option value="fixed_per_item">Fixed per item</option><option value="manual">Manual</option></select>
            <input name="name" required placeholder="Program name" className="h-10 border border-line px-2" />
            <input name="rateBps" type="number" placeholder="Basis points" className="h-10 border border-line px-2" />
            <input name="fixedMinor" type="number" placeholder="Fixed minor units" className="h-10 border border-line px-2" />
            <input name="currency" defaultValue="USD" className="h-10 border border-line px-2" />
            <label className="text-sm"><input name="isActive" type="checkbox" /> Active for accrual</label>
            <button className="h-10 bg-navy text-sm text-ivory">Save program</button>
          </form>
          <form action={recordContributionPayment} className="grid max-w-md gap-2">
            <select name="programId" className="h-10 border border-line px-2">{(programs ?? []).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select>
            <input name="amountMinor" type="number" required placeholder="Amount paid, minor units" className="h-10 border border-line px-2" />
            <input name="currency" defaultValue="USD" className="h-10 border border-line px-2" />
            <input name="paidOn" type="date" required className="h-10 border border-line px-2" />
            <input name="evidencePath" placeholder="Private evidence path" className="h-10 border border-line px-2" />
            <input name="note" placeholder="Note" className="h-10 border border-line px-2" />
            <button className="h-10 bg-navy text-sm text-ivory">Record payment</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function Staff({ roles }: { roles: string[] }) {
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Staff</h1>
      <p className="mt-2 text-sm text-muted">The first owner is created with `npm run create-owner`. This form grants other roles to an existing profile.</p>
      {hasPermission(roles, "staff.manage") ? (
        <form action={assignRole} className="mt-6 grid max-w-md gap-2">
          <input name="userId" required placeholder="Profile user id" className="h-10 border border-line px-2" />
          <select name="role" className="h-10 border border-line px-2">
            <option value="administrator">Administrator</option>
            <option value="operations_manager">Operations</option>
            <option value="inventory_manager">Inventory</option>
            <option value="customer_support">Support</option>
            <option value="sustainability_manager">Sustainability</option>
            <option value="marketing_manager">Marketing</option>
            <option value="auditor">Auditor</option>
          </select>
          <button className="h-10 bg-navy text-sm text-ivory">Grant role</button>
        </form>
      ) : <p className="mt-4 text-sm">Only the owner can grant roles.</p>}
    </section>
  );
}

async function Audit({ supabase, roles }: { supabase: Client; roles: string[] }) {
  if (!hasPermission(roles, "audit.read")) return <p>Your role cannot read the audit log.</p>;
  const { data } = await supabase.from("audit_logs").select("action, entity_type, created_at").order("created_at", { ascending: false }).limit(40);
  return (
    <section>
      <h1 className="font-display text-4xl text-navy">Audit</h1>
      <ul className="mt-4 text-sm">{(data ?? []).map((row, index) => <li key={`${row.action}-${index}`}>{String(row.created_at).slice(0, 19)} · {row.action} · {row.entity_type}</li>)}{(data ?? []).length === 0 ? <li>No audit events are visible.</li> : null}</ul>
    </section>
  );
}

export default function AdminPage({ params, searchParams }: { params: Promise<{ section?: string[] }>; searchParams: Promise<{ notice?: string }> }) {
  return (
    <Suspense fallback={<p>Loading the desk…</p>}>
      <Gate params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Gate({ params, searchParams }: { params: Promise<{ section?: string[] }>; searchParams: Promise<{ notice?: string }> }) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  return <Desk section={section?.[0] ?? ""} notice={query.notice} />;
}
