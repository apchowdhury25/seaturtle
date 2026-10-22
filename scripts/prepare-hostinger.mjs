import { access, cp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const serverFile = path.join(standalone, "server.js");

await access(serverFile);
await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

const source = await readFile(serverFile, "utf8");
const needle = "const hostname = process.env.HOSTNAME || '0.0.0.0'";
const replacement = "const hostname = '0.0.0.0'";
if (!source.includes(needle) && !source.includes(replacement)) {
  throw new Error("The standalone server no longer binds through the expected hostname line.");
}
if (source.includes(needle)) {
  await writeFile(serverFile, source.replace(needle, replacement));
}

console.log("Standalone server is ready: public files are included and it listens on 0.0.0.0.");
