# Migration map

What the two internet.io prototypes call each colour today, and the token that replaces it. Audited from GitHub `main` on 2026-09-29.

The app's colour names do not match Figma. Its `--blue-500` is `#2979ff`, which Figma calls `blue/600`, and its greys use a different numbering. The values are the same; only the names drifted.

## App: web and mobile layouts (`internetio-mobile-prototype`)

| Old variable | Value | New token | Note |
|---|---|---|---|
| `--navy-900` | `#081833` | `--color-blue-1000` | Renamed to Figma |
| `--navy-800` | `#0e2855` | `--color-blue-900` | Renamed to Figma |
| `--blue-700` | `#1b51aa` | `--color-blue-700` | Same |
| `--blue-500` | `#2979ff` | `--color-blue-600` | **Same value, one stop off Figma** |
| `--blue-50` | `#eaf2ff` | `--color-blue-75` | Figma's `blue/50` is `#fbfcff` |
| `--ink` | `#111111` | `--color-neutral-1000` | |
| `--grey-700` | `#3d3d3d` | `--color-neutral-900` | |
| `--grey-600` | `#5c5c5c` | `--color-neutral-800` | |
| `--grey-500` | `#6b6b6b` | `--color-neutral-650` | **Not in Figma. Proposed** |
| `--grey-400` | `#b8b8b8` | `--color-neutral-600` | |
| `--grey-300` | `#dcdcdc` | `--color-neutral-300` | |
| `--grey-150` | `#f1f1f1` | `--color-neutral-100` | |
| `--grey-100` | `#f5f5f5` | `--color-neutral-75` | |
| `--grey-50` | `#f8f8f8` | `--color-neutral-50` | **Not in Figma. Proposed** |
| `--white` | `#ffffff` | `--color-white` | |
| `--divider` | `rgba(220,220,220,.3)` | `--color-neutral-330` | |
| `--shadow-up` | | `--shadow-up-sm` | |
| `--radius-pill` | `48px` | `--radius-pill` | Now `9999px` |
| `--md-*` (14) | | `--color-m3-*` | Material 3 layer, `platform.android.json` |

## Landing page (`internetio-website`)

| Old variable | New token | Note |
|---|---|---|
| `--blue-600` | `--color-blue-600` | Same |
| `--navy` | `--color-blue-900` | |
| `--neutral-1000` `-900` `-800` `-700` `-600` | same names under `--color-neutral-*` | Same |
| `--neutral-330` | `--color-neutral-330` | |
| `--card` | `--color-surface-card` | Semantic |
| `--ph` | `--color-orange-600` | Product Hunt brand colour |
| `--shadow-hero` | `--shadow-hero` | |
| `--shadow-up` | `--shadow-up-md` | Different from the app's one |
| `--max` | not tokenised | Layout width; decide separately |

## Colours the code hardcodes that Figma does not define

Proposed as new primitives (`status: proposed` in `tokens/color.primitive.json`), to add to Figma or replace:

- `blue/25` `#f0faff` and the chip gradient end `#d7e7ff` (snapped to `blue/100` `#d4e4ff`)
- `blue/650` `#1565f0`, the hover colour. The landing page used `#1565f0`, the app used `#1f6ef0` and `#1c64dc`
- `neutral/50` `#f8f8f8` and `neutral/650` `#6b6b6b`
- `cyan/300` `#8fe6ff`, `cyan/400` `#32c6fe` and `sky/400` `#4fabfd` (landing page search glow and headline shimmer)
- `orange/600` `#ff6154` (Product Hunt, third party)
- Error reds: the app uses `#d93025`, `#c5221f` and `#b3261e`, while Figma's `red/600` is `#e53935`. **Decide which error red the app uses**

## Review items (rendered result changes slightly)

- Web section titles: 40px on a 1.5 line height (60px). Token `display` uses 48px.
- Phone hero: 36px snaps to `display-sm` (32px).
- Radius 20px (5 uses) snaps to `xl` (24px).
- Spacing 6, 10, 20, 36, 72 and 110px snap to the nearest scale step.
