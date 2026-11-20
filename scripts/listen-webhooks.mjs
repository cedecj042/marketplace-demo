import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY is missing from .env.");

const stripeShim = fileURLToPath(new URL("../node_modules/@stripe/cli/bin/shim.js", import.meta.url));
const child = spawn(process.execPath, [
  stripeShim,
  "listen",
  "--all-snapshot",
  "--events-from",
  "@accounts",
  "--forward-connect-to",
  "localhost:3000/api/stripe/webhook",
], {
  env: { ...process.env, STRIPE_API_KEY: secretKey },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
