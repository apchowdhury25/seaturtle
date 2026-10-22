import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const server = ".next/standalone/server.js";
if (!existsSync(server)) {
  console.error("The production server is missing. Run npm run build first.");
  process.exit(1);
}

const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: "0.0.0.0" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
