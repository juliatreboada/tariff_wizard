import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every catalog's entries by id, for links across catalogs (`sameAs`). */
const allEntries = new Map();

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
    const prefix = `${catalogId.toLowerCase()}-`;
    if (!String(entry.id).startsWith(prefix)) {
      errors.push(`${entry.id}: id must start with "${prefix}"`);
    }

    const groupImage = entry.variant?.groupImage;
    if (groupImage && !fs.existsSync(path.join(publicCatalog, groupImage))) {
      errors.push(`${entry.id}: missing group image ${groupImage}`);
    }
    const imagePath = path.join(publicCatalog, entry.image);
    if (!fs.existsSync(imagePath)) {
      errors.push(
        `missing image: ${entry.image}\n    → put file at public/catalog/${catalogId}/${entry.image}`,
      );
    }
  }

  for (const entry of manifest.entries ?? []) {
    for (const target of entry.sameAs ?? []) {
      const other = allEntries.get(target);
      if (!other) errors.push(`${entry.id}: same as unknown entry ${target}`);
      else if (!other.sameAs?.includes(entry.id)) errors.push(`${entry.id}: ${target} doesn't link back`);
    }
    for (const target of entry.attachesTo ?? []) {
      if (!ids.has(target)) errors.push(`${entry.id}: attaches to unknown entry ${target}`);
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

for (const id of catalogs) {
  const file = path.join(root, "catalog", id, "manifest.json");
  if (!fs.existsSync(file)) continue;
  for (const entry of JSON.parse(fs.readFileSync(file, "utf8")).entries ?? []) allEntries.set(entry.id, entry);
}

const allErrors = [];
// Every reviewed pair must name real entries, and both must carry the link.
const pairsFile = path.join(root, "catalog/same-elements.json");
if (fs.existsSync(pairsFile)) {
  for (const [a, b] of JSON.parse(fs.readFileSync(pairsFile, "utf8")).pairs) {
    for (const [from, to] of [[a, b], [b, a]]) {
      const entry = allEntries.get(from);
      if (!entry) allErrors.push(`same-elements.json: unknown entry ${from}`);
      else if (!entry.sameAs?.includes(to)) allErrors.push(`same-elements.json: ${from} is missing its link to ${to} (run the generators)`);
    }
  }
}
for (const id of catalogs) {
  allErrors.push(...validateCatalog(id));
}

if (allErrors.length) {
  console.error("Catalog validation failed:\n");
  for (const e of allErrors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Catalog OK: checked ${catalogs.join(", ")}.`);
