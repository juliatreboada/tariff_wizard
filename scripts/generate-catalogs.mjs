/**
 * Build the RFEG and FIG manifests. They link to each other (same-element
 * pairs, cells split into options), and each generator reads the other's
 * manifest, so run them until neither changes.
 *
 * Usage: node scripts/generate-catalogs.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifests = ["catalog/RFEG/manifest.json", "catalog/FIG/manifest.json"].map((f) => path.join(root, f));
const snapshot = () => manifests.map((f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : ""));

for (let round = 1; round <= 4; round++) {
  const before = snapshot();
  for (const script of ["generate-fig-manifest.mjs", "generate-rfeg-manifest.mjs"]) {
    execFileSync(process.execPath, [path.join(root, "scripts", script)], { stdio: "inherit" });
  }
  if (snapshot().every((text, i) => text === before[i])) {
    console.log(`Catalogs stable after ${round} round(s).`);
    process.exit(0);
  }
}
console.error("Catalogs still changing after 4 rounds.");
process.exit(1);
