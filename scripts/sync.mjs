// Keeps each product's copy of tokens.css identical to dist/tokens.css.
//   node scripts/sync.mjs           copy to the products
//   node scripts/sync.mjs --check   fail if a copy has drifted (used by npm test)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "dist", "tokens.css"), "utf8");
const targets = ["../internetio-website/tokens.css", "../internetio-mobile-prototype/tokens.css"].map((p) => join(root, p));
const check = process.argv.includes("--check");
let drifted = 0;
for (const t of targets) {
  if (!existsSync(t)) { console.log("skip (not found):", t); continue; }
  const same = readFileSync(t, "utf8") === src;
  if (check) { if (!same) { drifted++; console.log("DRIFT:", t.replace(join(root, ".."), "")); } }
  else if (!same) { writeFileSync(t, src); console.log("updated:", t.replace(join(root, ".."), "")); } else console.log("in sync:", t.replace(join(root, ".."), ""));
}
if (check && drifted) { console.log(`${drifted} product${drifted > 1 ? "s" : ""} out of sync. Run: npm run sync`); process.exit(1); }
if (check) console.log("products in sync");
