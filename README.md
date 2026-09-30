# internet.io design system

**Live docs:** https://devfawaz.github.io/internetio-design-system/docs/ (change a token in the playground and the live landing page and app follow)

I built the original internet.io design system as a Figma library while working as the product designer (2024 to 2025). This repo rebuilds its tokens and docs in code (2026).

Design tokens for internet.io, built from the Figma file "Design System - internet.io" and an audit of the two prototype repos: the internet.io app (one codebase with a desktop web layout at 1024px and wider and an Android-style mobile layout below it) and the landing page.

The Figma library ("Design System - internet.com", 35 pages, a preserved export of the original) has 36 variables, all colour. Type, spacing, radius, elevation and motion were not variables, so the code carried its own values, and the landing page and the app had drifted apart. This repo turns those into tokens from an audit of the code and records the evidence. It has not yet been cross-checked against the library's Typography and component pages.

## Three tiers

| Tier | Example | Rule |
|---|---|---|
| Primitive | `--color-blue-600`, `--text-md`, `--radius-xl` | Raw values and scales. Never used in component CSS. |
| Semantic | `--color-action-primary`, `--type-body-line`, `--shadow-popover` | What components use. Keeps `var()` references, so changing a primitive updates everything. |
| Component | `--button-height`, `--card-radius`, `--searchbar-border` | Component specs, including deliberate exceptions. |

## What the audit found (GitHub `main`, 2026-09-29)

| | Landing page | App (web and mobile layouts) |
|---|---|---|
| Font sizes | 11 | 22 |
| Border radii | 11 | 29 |
| Padding combinations | 39 | 133 |
| Hardcoded values (this repo's check) | 220 | 942 |

The app's colour names are one stop off Figma (`--blue-500` is Figma's `blue/600`). See [MIGRATION.md](MIGRATION.md) for the full old-to-new map.

## Tokens

257 tokens: 36 from Figma, 85 proposed from the audit, 136 semantic and component aliases. Each proposed token records how many times the code used it and which off-scale values it absorbs (`$extensions.iio`). Full table: [dist/TOKENS.md](dist/TOKENS.md).

```
tokens/
  color.primitive.json     Figma colours plus proposed additions
  scale.primitive.json     type, space, radius, motion, layering, breakpoints
  semantic.color.json      text, surface, border, action roles
  semantic.type.json       12 text styles
  semantic.effect.json     shadows, focus, state opacities, motion presets
  component.json           button, icon button, search bar, card, chip, sheet, avatar
  platform.android.json    Material 3 layer used by the app's mobile layout
scripts/
  build.mjs                tokens -> dist/
  check.mjs                finds hardcoded values and suggests the token
dist/
  tokens.css               CSS custom properties
  tailwind-theme.css       same tokens as a Tailwind v4 @theme block (optional)
  tokens.json              resolved values with source metadata
  TOKENS.md                reference table
```

## Use

```bash
npm run build              # tokens/*.json -> dist/
npm run check -- path/to/style.css --top 8
```

Link `dist/tokens.css` before the prototype's stylesheet. Names follow Tailwind v4's theme namespaces (`--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`), so the same file works as a Tailwind theme without changes. The prototypes themselves stay plain HTML, CSS and JavaScript with no build step.

## Quality gates

`npm test` builds and then enforces, in code:

| Gate | What it checks |
|---|---|
| Layering | Components use semantic colours, semantic colours use primitives, primitives are literal |
| Provenance | Every proposed token records its evidence from the audit |
| Naming and scales | Valid, unique CSS names; every step in a scale has a distinct value |
| Contrast | 48 text and control pairs against WCAG 2.2 AA. A failing pair needs a reasoned waiver in `tokens/a11y.json` |
| Products | Neither product references a token that does not exist, and both carry an identical `tokens.css` |
| Docs | The docs page itself has zero hardcoded values |
| Build | `dist/` and `docs/tokens.data.js` are committed and up to date (CI) |

Current result: 44 of 48 pairs pass, 4 are waived with reasons (all accepted), 0 fail. White text on brand blue `blue/600` is 3.98:1, so text-bearing primary buttons use `blue/650` (5.06:1) in both products, and the same rule gives `red/650` for danger. See [CHANGELOG.md](CHANGELOG.md).

## Docs page

`docs/index.html` documents every token from the generated data: colour ramps, semantic roles, text styles, spacing, radius, elevation, motion, components built from component tokens, and a table of where each proposed token came from. The page is written with tokens only (`npm run check -- docs/docs.css` reports zero hardcoded values).

The playground on the right changes one value and everything using the token follows, on the page and inside the landing page and the app, which load in frames: brand blue (regenerates the whole blue ramp from one colour), corner radius, type size and spacing.

```bash
npm run docs            # serves ../ on http://localhost:5400
```

Open `http://localhost:5400/internetio-design-system/docs/`. The product previews need the prototypes folder served; opened straight from disk, the page still works but the previews are blocked.

## Adoption (2026-09-29)

Both prototypes now link `tokens.css` and no longer define their own colour, type or spacing variables. `scripts/migrate.mjs` replaces only values that equal a token exactly, so nothing changes visually. `verify/` proves it: computed styles on every element, across every screen, at three widths, with zero differences.

| | Before | After | Reduction |
|---|---|---|---|
| Landing page hardcoded values | 220 | 64 | 71% |
| App hardcoded values | 942 | 255 | 73% |

The rest cannot be replaced without a visible change (off-scale spacing such as 10px, radii such as 20px, and colours or shadows with no token yet). They are decisions, listed by `npm run check`.

## Not done yet

- The remaining 319 values above
- Dark mode (Figma has a single mode)
- Pushing the proposed tokens back into Figma as variables
- A live docs page with a token editor
