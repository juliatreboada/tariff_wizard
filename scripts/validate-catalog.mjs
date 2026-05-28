import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} catalogId e.g. FGX */
function validateCatalog(catalogId) {
  const manifestPath = path.join(root, "catalog", catalogId, "manifest.json");
  const publicCatalog = path.join(root, "public/catalog", catalogId);

  if (!fs.existsSync(manifestPath)) {
    return [`missing manifest: ${manifestPath}`];
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const errors = [];

  if (manifest.version !== 1) {
    errors.push(`${catalogId}: version must be 1`);
  }
  if (manifest.code !== catalogId) {
    errors.push(
      `${catalogId}: manifest.code must be "${catalogId}" (got "${manifest.code}")`,
    );
  }

  const ids = new Set();
  for (const entry of manifest.entries ?? []) {
    if (ids.has(entry.id)) errors.push(`duplicate id: ${entry.id}`);
    ids.add(entry.id);

    if (entry.code !== catalogId) {
      errors.push(`${entry.id}: entry.code must be ${catalogId}`);
    }

    const imagePath = path.join(publicCatalog, entry.image);
    if (!fs.existsSync(imagePath)) {
      errors.push(
        `missing image: ${entry.image}\n    → put file at public/catalog/${catalogId}/${entry.image}`,
      );
    }
  }

  return errors;
}

const catalogs = fs.existsSync(path.join(root, "catalog"))
  ? fs
      .readdirSync(path.join(root, "catalog"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

const allErrors = [];
for (const id of catalogs) {
  allErrors.push(...validateCatalog(id));
}

if (allErrors.length) {
  console.error("Catalog validation failed:\n");
  for (const e of allErrors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Catalog OK: checked ${catalogs.join(", ")}.`);
