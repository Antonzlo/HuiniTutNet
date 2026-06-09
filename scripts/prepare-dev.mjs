import { existsSync, rmSync } from "fs";

const fresh = process.argv.includes("--fresh");
const nextDir = ".next";

if (fresh && existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("[dev] cleared .next");
} else {
  for (const sub of ["cache", "server"]) {
    const p = `${nextDir}/${sub}`;
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
    }
  }
}
