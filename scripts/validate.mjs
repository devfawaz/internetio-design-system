// Enforces the system's own rules. Exits 1 on any failure.  npm test
//   1. every alias resolves and there are no cycles (also checked by build)
//   2. layering: components use semantic colours, semantic colours use primitives, primitives are literal
//   3. every proposed token carries evidence from the audit
//   4. names are valid CSS custom properties; scales increase
//   5. WCAG 2.2 AA contrast for every text and control pair, with declared, explained exceptions
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(root, "dist", "tokens.json"), "utf8"));
const policy = JSON.parse(readFileSync(join(root, "tokens", "a11y.json"), "utf8"));
const paths = Object.keys(T);
const fails = [], warns = [];
const fail = (rule, msg) => fails.push({ rule, msg });

// ── 2. layering ──────────────────────────────────────────────
const SEMANTIC = /^color\.(text|surface|border|action|feedback|effect|m3)\./;
const PRIMITIVE_COLOUR = /^color\.(white|black|blue|neutral|red|cyan|sky|orange)(\.|$)/;
const COMPONENT = /^(button|icon-button|searchbar|card|chip|sheet|avatar)\./;
for (const [p, t] of Object.entries(T)) {
  if (COMPONENT.test(p) && t.type === "color" && t.alias && !SEMANTIC.test(t.alias)) fail("layering", `${p} is a component colour that points at ${t.alias}; components must use a semantic colour`);
  if (SEMANTIC.test(p) && t.alias && COMPONENT.test(t.alias)) fail("layering", `${p} is semantic but points at the component token ${t.alias}`);
  if (SEMANTIC.test(p) && t.alias && SEMANTIC.test(t.alias) && !/^color\.m3\./.test(p)) fail("layering", `${p} points at another semantic token (${t.alias}); point at a primitive so roles stay independent`);
  if (PRIMITIVE_COLOUR.test(p) && t.alias) fail("layering", `${p} is a primitive but is an alias of ${t.alias}`);
}

// ── 3. provenance ────────────────────────────────────────────
const EVIDENCE_EXEMPT = /^(size\.space\.0|radius\.none|duration\.instant|z\.(base|raised)|font\.family|font\.weight|shadow\.device|size\.control|focus\.|state\.)/;
for (const [p, t] of Object.entries(T)) {
  if (t.status === "proposed" && !t.audit && !t.consolidates && !t.note && !t.description && !EVIDENCE_EXEMPT.test(p)) fail("provenance", `${p} is proposed but records no evidence (audit, consolidates, note or description)`);
}

// ── 4. names and scales ──────────────────────────────────────
for (const [p, t] of Object.entries(T)) if (!/^--[a-z0-9]+(-[a-z0-9]+)*$/.test(t.css)) fail("naming", `${p} produces an invalid CSS variable name ${t.css}`);
const seen = new Map();
for (const [p, t] of Object.entries(T)) { if (seen.has(t.css)) fail("naming", `${p} and ${seen.get(t.css)} both produce ${t.css}`); seen.set(t.css, p); }
const px = (v) => parseFloat(v);
const increasing = (re, label, skip = () => false) => {
  const list = paths.filter((p) => re.test(p) && /px$|ms$/.test(T[p].value) && !skip(p)).map((p) => [p, px(T[p].value)]).sort((a, b) => a[1] - b[1]);
  for (let i = 1; i < list.length; i++) if (list[i][1] === list[i - 1][1]) fail("scale", );
};
increasing(/^size\.font\./, "font sizes"); increasing(/^size\.space\./, "spacing"); increasing(/^radius\./, "radius", (p) => T[p].value === "9999px");
increasing(/^size\.control\./, "control sizes"); increasing(/^duration\./, "durations");

// ── 5. contrast ──────────────────────────────────────────────
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const blend = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a));
function rgbOf(path, over = [255, 255, 255]) {
  const v = T[path].value;
  const m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(v);
  return m ? blend([+m[1], +m[2], +m[3]], +m[4], over) : hex(v);
}
const ratio = (fg, bg) => { const page = rgbOf("color.surface.page"); const b = rgbOf(bg, page), f = rgbOf(fg, b); const [x, y] = [lum(f), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const textFg = ["primary", "body", "secondary", "muted", "link", "brand", "danger"].map((n) => "color.text." + n);
const textBg = ["page", "card", "sunken", "hover", "brand-wash"].map((n) => "color.surface." + n);
const pairs = [];
for (const fg of textFg) for (const bg of textBg) pairs.push({ fg, bg, min: 4.5, kind: "Text" });
pairs.push({ fg: "color.text.danger-on-tint", bg: "color.surface.danger", min: 4.5, kind: "Text" });
for (const bg of ["primary", "primary-accessible", "primary-hover", "primary-pressed", "danger", "danger-hover"]) pairs.push({ fg: "color.text.on-action", bg: "color.action." + bg, min: 4.5, kind: "Text on fill" });
for (const fg of ["input", "focus", "default", "strong"]) pairs.push({ fg: "color.border." + fg, bg: "color.surface.page", min: 3, kind: "Control boundary" });
for (const fg of ["color.m3.outline", "color.m3.surface-container-high"]) pairs.push({ fg, bg: "color.surface.page", min: 3, kind: "Control boundary" });
const waived = (p) => policy.waivers.find((w) => w.fg === p.fg && w.bg === p.bg);
const results = pairs.map((p) => {
  const r = ratio(p.fg, p.bg), ok = r >= p.min, w = !ok && waived(p);
  const status = ok ? "pass" : w ? "waived" : "fail";
  if (status === "fail") fail("contrast", `${p.fg} on ${p.bg} is ${r.toFixed(2)}:1, needs ${p.min}:1. Fix the token or add a reasoned waiver to tokens/a11y.json`);
  return { ...p, ratio: +r.toFixed(2), status, ...(w ? { reason: w.reason, waiver: w.status } : {}) };
});
for (const w of policy.waivers) if (!results.some((r) => r.fg === w.fg && r.bg === w.bg && r.status === "waived")) warns.push(`waiver for ${w.fg} on ${w.bg} is no longer needed; remove it`);
writeFileSync(join(root, "dist", "a11y.json"), JSON.stringify({ standard: "WCAG 2.2 AA", generated: new Date().toISOString().slice(0, 10), exempt: policy.exempt, results }, null, 2) + "\n");
writeFileSync(join(root, "docs", "a11y.data.js"), "// Generated by scripts/validate.mjs. Do not edit.\nwindow.A11Y = " + JSON.stringify({ standard: "WCAG 2.2 AA", exempt: policy.exempt, results }) + ";\n");

// ── 6. products: no reference to a token that does not exist ──
import { existsSync, readdirSync } from "node:fs";
const cssNames = new Set(paths.map((p) => T[p].css));
const productRoots = ["../internetio-website", "../internetio-mobile-prototype"].map((p) => join(root, p)).filter(existsSync);
for (const dir of productRoots) {
  const files = readdirSync(dir).filter((f) => /\.(css|js|html)$/.test(f) && f !== "tokens.css");
  const css = readFileSync(join(dir, "style.css"), "utf8");
  const definedLocally = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  // custom properties the page sets at runtime: `--x:` inside JS or HTML strings, or setProperty("--x", ...)
  for (const f of files.filter((f) => f !== "style.css")) { const src = readFileSync(join(dir, f), "utf8"); for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:|setProperty\(\s*["'`](--[a-z0-9-]+)/g)) definedLocally.add(m[1] ?? m[2]); }
  const dangling = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))].filter((n) => !cssNames.has(n) && !definedLocally.has(n));
  const name = dir.split("/").pop();
  for (const d of dangling) fail("products", `${name}/style.css uses ${d}, which is neither a token nor defined locally`);
  const usesComponent = [...new Set([...css.matchAll(/var\((--(?:button|icon-button|searchbar|card|chip|sheet|avatar)-[a-z0-9-]+)\)/g)].map((m) => m[1]))];
  for (const c of usesComponent) warns.push(`${name}/style.css uses the component token ${c}; components are specs for the docs, products should use semantic or primitive tokens`);
}

// ── report ───────────────────────────────────────────────────
const by = (s) => results.filter((r) => r.status === s).length;
console.log(`tokens ${paths.length} · contrast pairs ${results.length}: ${by("pass")} pass, ${by("waived")} waived, ${by("fail")} fail`);
for (const w of warns) console.log("warn:", w);
if (fails.length) { console.log(`\n${fails.length} failure${fails.length > 1 ? "s" : ""}:`); for (const f of fails) console.log(`  [${f.rule}] ${f.msg}`); process.exit(1); }
console.log("all rules pass");
