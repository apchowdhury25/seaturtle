import "server-only";

import { createAdminClient } from "@/server/supabase";
import { sha256 } from "@/lib/security";
import { siteUrl } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateKey: string;
};

function shell(title: string, body: string): { html: string; text: string } {
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ec;color:#1c1917;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="letter-spacing:.18em;text-transform:uppercase;font-size:12px;font-family:Arial,sans-serif;">Sea Turtle Apparel</p>
    <h1 style="font-weight:400;font-size:32px;">${title}</h1>
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;">${body}</div>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#5c564e;">Wear the Change. Protect Our Oceans.</p>
  </div></body></html>`;
  const text = `${title}\n\n${body.replace(/<[^>]+>/g, " ")}\n\nSea Turtle Apparel`;
  return { html, text };
}

export function orderEmail(input: { orderNumber: string; totalLabel: string; status: string; trackingUrl?: string }): EmailMessage {
  const rendered = shell(
    `Order ${input.orderNumber}`,
    `<p>Status: ${input.status}.</p><p>Total: ${input.totalLabel}.</p>${input.trackingUrl ? `<p><a href="${input.trackingUrl}">View this order</a></p>` : ""}<p>Payment is confirmed only after the payment provider verifies it. A browser return is not proof of payment.</p>`,
  );
  return { to: "", templateKey: "order", subject: `Sea Turtle Apparel order ${input.orderNumber}`, ...rendered };
}

export function accountEmail(kind: "verify" | "reset", link: string): EmailMessage {
  const title = kind === "verify" ? "Confirm your email" : "Reset your password";
  const rendered = shell(title, `<p><a href="${link}">${title}</a></p><p>If you did not request this, you can ignore the message.</p>`);
  return { to: "", templateKey: kind, subject: title, ...rendered };
}

export async function sendEmail(message: EmailMessage): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let status: "sent" | "skipped" | "failed" = "skipped";
  let error: string | null = null;
  if (!apiKey || !from || !message.to) {
    status = "skipped";
    error = "Email delivery is not configured.";
  } else {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    });
    status = response.ok ? "sent" : "failed";
    if (!response.ok) error = `Provider returned ${response.status}.`;
  }
  const admin = createAdminClient();
  if (admin) {
    await admin.from("notification_logs").insert({
      template_key: message.templateKey,
      recipient_hash: message.to ? sha256(message.to.toLowerCase()) : null,
      status,
      provider: apiKey ? "resend" : null,
      error,
    });
  }
  return status;
}

export function absolute(path: string): string {
  return `${siteUrl()}${path}`;
}
