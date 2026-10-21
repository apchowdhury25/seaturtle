# Security

- Sessions use Supabase Auth cookies through the server client. The service role key is never sent to the browser.
- `src/proxy.ts` refreshes the session when Supabase public keys exist, redirects `www` to the apex, and can rewrite the site into maintenance mode.
- Security headers, including a Content-Security-Policy, are set in `next.config.mjs`.
- Server actions validate input with Zod. Checkout and the contact form are rate limited in process memory. That limit does not span multiple servers; put a shared limiter in front of the VPS if you run more than one instance.
- Guest order lookup requires the high-entropy tracking token. The raw token is returned once at checkout and stored only as a hash.
- The cart cookie is essential. Optional analytics are not loaded before the cookie notice stores acceptance. No third-party analytics script is embedded yet.
- Privileged admin actions write `audit_logs`.
- Public trace copy rejects phrases such as "carbon neutral" and "100% sustainable".
- Uploads check MIME type and size before they go to Storage.
- Do not commit `.env`, `.env.local`, or owner passwords. `.env.example` holds placeholders only.

## Privacy requests

Signed-in customers can request access, correction, export, or deletion. Staff process the row. Completion is a separate status.

## What this is not

The in-memory rate limiter, the operational sales totals, and the policy pages are not a finished compliance program. Have counsel review privacy and consumer terms for Bangladesh and each shipping destination.
