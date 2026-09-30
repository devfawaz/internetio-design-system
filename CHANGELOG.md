# Changelog

Versioning: minor for new tokens, patch for value fixes, major for renames or removals. Every release lists what a consumer must change.

## 0.3.0 (2026-09-29)

### Added
- `color.red.650` (`#c5221f`): the AA-safe red for text and filled buttons (white on it is 5.8:1). It is the red counterpart of `blue/650`. Proposed for Figma.
- `color.text.danger-on-tint` (`red/700`) for error text on the pale red surface; `color.action.danger-hover`.
- Contrast pairs for the Material 3 outline and the filled search bar (48 pairs total).

### Changed (consumers should note)
- **Adopted in both products:** the primary button fill is `color.action.primary-accessible` (`blue/650`, 5.06:1 with white text) and its hover is `blue/700`. Brand `blue/600` remains for icons, borders and focus.
- **Adopted in the app:** danger colours unify to `red/650` for text and fills, `red/700` on hover. This replaces `#d93025`, `#b3261e` and the old `#c5221f` hover.
- `color.text.danger` is `red/650` (was `red/700`); `color.action.danger` is `red/650` (was `red/700`); `color.m3.error` aliases `red/650`.
- The accessibility exception for white on `blue/600` is now `accepted`, not open: the brand colour is not used behind text.

### Found, not changed
- The app's search bars are Material 3 filled containers with no outline (1.2:1 fill against white). Recorded as an accepted exception in `tokens/a11y.json`. `color.border.input` exists for outlined fields but no product uses it: an earlier attempt to apply it to the app's field borders had no visible effect, because the Material 3 layer overrides those rules, so it was reverted.
- The landing page's secondary button text (`neutral/700` on white, 4.2:1) and the app's dialog placeholder text (`neutral/600`) are below 4.5:1. Not adopted yet.

## 0.2.0 (2026-09-29)

### Added
- `npm test`: build, validate and check. The validator enforces layering (components use semantic colours, semantic colours use primitives), evidence on every proposed token, valid and distinct names, and WCAG 2.2 AA contrast for 44 text and control pairs.
- `tokens/a11y.json`: exceptions must be declared with a reason. Three are declared.
- Accessibility remedies as proposed tokens: `color.action.primary-accessible`, `color.border.input`.
- Semantic `color.surface.chip-from` and `chip-to`.
- `scripts/sync.mjs`: keeps each product's `tokens.css` identical to `dist/tokens.css`.
- Docs page with a live playground; accessibility section.
- CI workflow.

### Changed (consumers should note)
- `color.text.muted` now points at `neutral/650` (was `neutral/700`, 4.2:1 on white; now 5.3:1).
- `color.text.link` is `blue/700` (blue/600 is 4.0:1 on white).
- `color.action.danger` is `red/700` (red/600 with white text is 4.2:1).
- Primary button fill is `color.action.primary-accessible` (`blue/650`); hover is `blue/700`.

### Removed
- `color.text.tertiary`, which duplicated `color.text.muted` after the change above. Nothing in the products used it.

### Known open decision
- White text on brand blue `blue/600` is 3.98:1. The products still use it for primary buttons. See `tokens/a11y.json`.

## 0.1.0 (2026-09-29)

First release: 257 tokens (36 from Figma, 85 proposed from the audit of the landing page and app, 136 semantic and component aliases).
