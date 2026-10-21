import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;

if (!url || !key || !email || !password || password.length < 10) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, OWNER_EMAIL, and OWNER_PASSWORD (10+ characters).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const created = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "Owner" },
});
if (created.error || !created.data.user) {
  console.error(created.error?.message ?? "The owner account was not created.");
  process.exit(1);
}

const role = await supabase.from("user_roles").insert({ user_id: created.data.user.id, role: "owner" });
if (role.error) {
  console.error(role.error.message);
  process.exit(1);
}

console.log("Owner role granted. The password was not printed. There is no public admin registration.");
