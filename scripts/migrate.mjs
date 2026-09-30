// Adopts the tokens in a stylesheet without changing how it renders.
//   node scripts/migrate.mjs path/to/style.css --profile web [--write]
// Only values that equal a token exactly are replaced. Anything that would need snapping to the nearest
// scale step (a visible change) is left alone; scripts/check.mjs lists what remains.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "dist", "tokens.json"), "utf8"));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && a !== args[args.indexOf("--profile") + 1]);
const profile = args[args.indexOf("--profile") + 1];
const write = args.includes("--write");

// Old custom property -> new token, per prototype (see MIGRATION.md).
const profiles = {
  web: {
    "--white": "--color-white", "--black": "--color-black", "--blue-600": "--color-blue-600", "--navy": "--color-blue-900",
    "--neutral-1000": "--color-neutral-1000", "--neutral-900": "--color-neutral-900", "--neutral-800": "--color-neutral-800",
    "--neutral-700": "--color-neutral-700", "--neutral-600": "--color-neutral-600", "--neutral-330": "--color-neutral-330",
    "--card": "--color-surface-card", "--ph": "--color-effect-third-party-ph", "--shadow-hero": "--shadow-hero", "--shadow-up": "--shadow-up-md",
    keep: ["--max"],
  },
};
profiles.app = {
  "--navy-900": "--color-blue-1000", "--navy-800": "--color-blue-900", "--blue-700": "--color-blue-700", "--blue-500": "--color-blue-600",
  "--blue-50": "--color-blue-75", "--ink": "--color-neutral-1000", "--grey-700": "--color-neutral-900", "--grey-600": "--color-neutral-800",
  "--grey-500": "--color-neutral-650", "--grey-400": "--color-neutral-600", "--grey-300": "--color-neutral-300", "--grey-150": "--color-neutral-100",
  "--grey-100": "--color-neutral-75", "--grey-50": "--color-neutral-50", "--white": "--color-white", "--divider": "--color-neutral-330",
  "--shadow-up": "--shadow-up-sm", "--radius-pill": "--radius-pill", "--font": "--font-sans",
  "--md-primary": "--color-m3-primary", "--md-on-surface": "--color-m3-on-surface", "--md-on-surface-variant": "--color-m3-on-surface-variant",
  "--md-outline": "--color-m3-outline", "--md-outline-variant": "--color-m3-outline-variant", "--md-secondary-container": "--color-m3-secondary-container",
  "--md-surface-container": "--color-m3-surface-container", "--md-surface-container-high": "--color-m3-surface-container-high",
  "--md-inverse-surface": "--color-m3-inverse-surface", "--md-inverse-on-surface": "--color-m3-inverse-on-surface",
  "--md-inverse-primary": "--color-m3-inverse-primary", "--md-error": "--color-m3-error",
  "--md-spring": "--ease-spring", "--md-emphasized": "--ease-emphasized",
  keep: ["--device-w", "--device-h"],
};
const map = profiles[profile];
if (!file || !map) { console.error("usage: migrate.mjs style.css --profile web|app [--write]"); process.exit(2); }

const norm = (c) => c.toLowerCase().replace(/\s+/g, "").replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, "#$1$1$2$2$3$3");
const primitive = new Map(), semantic = new Map();
// Only real primitives (and semantic roles as a fallback) may replace a literal colour. Component tokens never may:
// two unrelated things sharing a value must not end up coupled through a component token.
for (const [path, t] of Object.entries(tokens)) {
  if (t.type !== "color" || typeof t.value !== "string") continue;
  if (/^color\.(white|black|blue|neutral|red|cyan|sky|orange)(\.|$)/.test(path)) primitive.set(norm(t.value), t.css);
  else if (/^color\.(text|surface|border|action|feedback|effect|m3)\./.test(path)) semantic.set(norm(t.value), t.css);
}
const colourToken = (lit) => primitive.get(norm(lit)) ?? semantic.get(norm(lit));
const px = (prefix) => new Map(Object.values(tokens).filter((t) => t.css.startsWith(prefix) && /^\d+px$/.test(String(t.value))).map((t) => [String(t.value), t.css]));
const sizeText = px("--text-"), sizeSpace = px("--space-"), radius = px("--radius-");
radius.delete("9999px");
const weight = new Map([["400", "--font-weight-regular"], ["500", "--font-weight-medium"], ["600", "--font-weight-semibold"]]);
const dur = new Map([[".15s", "--duration-fast"], ["0.15s", "--duration-fast"], [".2s", "--duration-base"], ["0.2s", "--duration-base"], [".3s", "--duration-slow"], ["0.3s", "--duration-slow"], [".5s", "--duration-slower"], ["0.5s", "--duration-slower"]]);

let css = readFileSync(file, "utf8");
const stats = {};
const bump = (k) => (stats[k] = (stats[k] ?? 0) + 1);

// 1. replace every :root block: tokens.css now supplies everything except layout values kept locally
const rootKept = new Map();
css = css.replace(/:root\s*\{[\s\S]*?\n\}/g, (block) => {
  for (const m of block.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) if (map.keep.includes(m[1])) rootKept.set(m[1], m[2]);
  bump("root block replaced");
  return "@@ROOT@@";
});
let firstRoot = true;
css = css.replace(/@@ROOT@@\n?/g, () => {
  if (!firstRoot) return "";
  firstRoot = false;
  return ":root {\n" + [...rootKept].map(([k, v]) => `  ${k}: ${v};`).join("\n") + "\n}\n";
});

// 2. rename old variable references
css = css.replace(/var\((--[a-z0-9-]+)(?=[,)])/g, (m, name) => {
  if (map[name] && name !== "keep") { bump("variable renamed"); return `var(${map[name]}`; }
  return m;
});

// 3. exact literal replacements, outside the (now tiny) :root block
const cut = css.indexOf("\n}\n") + 3;
const head = css.slice(0, cut);
let body = css.slice(cut);
body = body.replace(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g, (lit, offset) => {
  const before = body.slice(Math.max(0, offset - 40), offset);
  if (/url\(\s*["']?[^)]*$/.test(before)) return lit;
  const t = colourToken(lit);
  if (!t) return lit;
  bump("colour");
  return `var(${t})`;
});
body = body.replace(/\b(font-size|font-weight|border-radius|gap|row-gap|column-gap|padding[a-z-]*|margin[a-z-]*|transition)\s*:\s*([^;}]+)/g, (m, prop, val) => {
  let out = val, changed = false;
  if (prop === "font-size") out = val.replace(/(?<![\w.-])(\d+)px\b/g, (x) => (sizeText.has(x) ? (changed = true, bump("font-size"), `var(${sizeText.get(x)})`) : x));
  else if (prop === "font-weight") out = val.replace(/^\s*(\d+)\s*$/, (x, n) => (weight.has(n) ? (changed = true, bump("font-weight"), ` var(${weight.get(n)})`) : x));
  else if (prop === "border-radius") out = val.replace(/(?<![\w.-])(\d+)px\b/g, (x) => (radius.has(x) ? (changed = true, bump("radius"), `var(${radius.get(x)})`) : x)).replace(/\b50%/g, () => (changed = true, bump("radius"), "var(--radius-circle)"));
  else if (prop === "transition") {
    out = val.replace(/(?<![\w.-])(0?\.\d+s)\b/g, (x) => (dur.has(x) ? (changed = true, bump("duration"), `var(${dur.get(x)})`) : x))
             .replace(/cubic-bezier\(\.2,\s*\.7,\s*\.2,\s*1\)/g, () => (changed = true, bump("easing"), "var(--ease-standard)"));
  } else out = val.replace(/(?<![\w.-])(\d+)px\b/g, (x) => (sizeSpace.has(x) ? (changed = true, bump("spacing"), `var(${sizeSpace.get(x)})`) : x));
  return changed ? `${prop}:${out.startsWith(" ") ? out : " " + out}` : m;
});
css = head + body;

console.log(`${file}: ${Object.entries(stats).map(([k, v]) => `${k} ${v}`).join(", ")}`);
if (write) { writeFileSync(file, css); console.log("written"); } else console.log("dry run (use --write)");
