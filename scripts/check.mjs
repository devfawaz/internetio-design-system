// Finds hardcoded design values in a stylesheet and suggests the token that should replace each one.
//   node scripts/check.mjs path/to/style.css [--max N] [--json] [--top N]
// Exits 1 when the number of findings is above --max (default 0), so it can gate a commit or CI run.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "dist", "tokens.json"), "utf8"));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && !/^\d+$/.test(a));
const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : dflt; };
const max = flag("--max", 0), top = flag("--top", 12), asJson = args.includes("--json");
if (!file) { console.error("usage: check.mjs style.css [--max N] [--top N] [--json]"); process.exit(2); }

const norm = (c) => c.toLowerCase().replace(/\s+/g, "").replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, "#$1$1$2$2$3$3");
const byColour = new Map();
for (const [path, t] of Object.entries(tokens)) {
  if (t.type !== "color" || typeof t.value !== "string" || !/^color\./.test(path)) continue;
  const k = norm(t.value);
  const semantic = /^color\.(text|surface|border|action|feedback|effect|m3)\./.test(path);
  const cur = byColour.get(k);
  if (!cur || (!semantic && cur.semantic)) byColour.set(k, { css: t.css, semantic });
}
const scale = (prefix) => Object.values(tokens).filter((t) => t.css.startsWith(prefix) && /^-?\d+(\.\d+)?px$/.test(String(t.value))).map((t) => ({ css: t.css, px: parseFloat(t.value) }));
const scales = { text: scale("--text-"), radius: scale("--radius-"), space: scale("--space-") };
const nearest = (list, px) => list.reduce((b, t) => (Math.abs(t.px - px) < Math.abs(b.px - px) ? t : b), list[0]);

let css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
// blank out :root blocks (token definitions are allowed to hold literals)
css = css.replace(/:root\s*\{[^}]*\}/g, (m) => m.replace(/[^\n]/g, " "));

const findings = [];
const lines = css.split("\n");
lines.forEach((line, i) => {
  const add = (category, value, suggestion) => findings.push({ line: i + 1, category, value, suggestion });
  // skip declarations that already use a token for everything
  for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)) {
    const hit = byColour.get(norm(m[0]));
    add("colour", m[0], hit ? `var(${hit.css})` : "no token: add one or snap to a palette colour");
  }
  const decl = line.match(/\b(font-size|border-radius|gap|row-gap|column-gap|padding[a-z-]*|margin[a-z-]*)\s*:\s*([^;}]*)/);
  if (decl) {
    const [, prop, val] = decl;
    for (const m of val.matchAll(/(?<![\w.-])(-?\d+(?:\.\d+)?)px\b/g)) {
      const px = parseFloat(m[1]);
      if (px === 0) continue;
      const kind = prop === "font-size" ? "text" : prop === "border-radius" ? "radius" : "space";
      const cat = kind === "text" ? "font-size" : kind === "radius" ? "radius" : "spacing";
      if (kind === "radius" && px >= 28) { add(cat, `${prop}: ${m[1]}px`, "snap to var(--radius-pill)"); continue; }
      const n = nearest(kind === "radius" ? scales.radius.filter((t) => t.px < 9999) : scales[kind], px);
      add(cat, `${prop}: ${m[1]}px`, n.px === px ? `var(${n.css})` : `snap to var(${n.css}) (${n.px}px)`);
    }
  }
  const sh = line.match(/box-shadow\s*:\s*([^;}]*)/);
  if (sh && /\d+px/.test(sh[1]) && !/^\s*var\(/.test(sh[1]) && !/inset/.test(sh[1])) add("shadow", sh[1].trim().slice(0, 60), "use a --shadow-* token");
  for (const m of line.matchAll(/\b(transition|animation)\s*:\s*([^;}]*)/g)) {
    for (const d of m[2].matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)) {
      const ms = d[2] === "s" ? parseFloat(d[1]) * 1000 : parseFloat(d[1]);
      if (ms < 100 || ms > 500 || m[1] === "animation" && ms > 500) continue;
      add("motion", `${m[1]} ${d[0]}`, "use var(--duration-*) and var(--ease-*)");
    }
  }
});

const byCat = {};
for (const f of findings) (byCat[f.category] ??= []).push(f);
if (asJson) { console.log(JSON.stringify({ file, total: findings.length, byCategory: Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, v.length])), findings }, null, 2)); }
else {
  console.log(`${file}: ${findings.length} hardcoded values`);
  for (const [cat, list] of Object.entries(byCat).sort((a, b) => b[1].length - a[1].length)) {
    const distinct = new Map();
    for (const f of list) { const k = f.value + " -> " + f.suggestion; distinct.set(k, (distinct.get(k) ?? 0) + 1); }
    console.log(`\n${cat}: ${list.length} uses, ${distinct.size} distinct`);
    for (const [k, n] of [...distinct].sort((a, b) => b[1] - a[1]).slice(0, top)) console.log(`  ${String(n).padStart(4)}  ${k}`);
  }
}
process.exit(findings.length > max ? 1 : 0);
