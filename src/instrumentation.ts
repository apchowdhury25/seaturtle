export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logConfigStatus } = await import("@/lib/env");
  logConfigStatus();
}
