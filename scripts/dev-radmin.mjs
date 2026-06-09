import { spawn } from "node:child_process";
import { radminUrls } from "../../scripts/radmin-host.mjs";

const { host, webUrl, apiUrl } = radminUrls();

console.log("[radmin] ─────────────────────────────");
console.log(`[radmin] Host:     ${host}`);
console.log(`[radmin] Site:     ${webUrl}`);
console.log(`[radmin] API:      ${apiUrl}`);
console.log(`[radmin] Login:    ${webUrl}/login`);
console.log("[radmin] Запусти backend: npm run dev:radmin");
console.log("[radmin] ─────────────────────────────");

const child = spawn("npx next dev -H 0.0.0.0 -p 3000", {
  shell: true,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_API_URL: apiUrl },
});

child.on("exit", (code) => process.exit(code ?? 0));
