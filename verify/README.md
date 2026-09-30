# Visual-equivalence check

Proves that adopting the tokens did not change how a prototype renders. It compares computed styles, not screenshots, so a 1px or one-shade change is caught.

## How it works

`harness.html` loads the original build (`/old`) and the migrated build (`/new`) in two same-origin iframes of the same width, drives both through the same screens (guest and signed-in, every route, plus the agent popup and the avatar menu), and compares 40 computed properties on every element. Animations are paused at the same point in both. Border radius is compared after clamping to half the element's shorter side, since `48px` and `9999px` render identically on a pill; hidden elements are skipped for radius.

## Run it

```bash
mkdir /tmp/cmp && cd /tmp/cmp
mkdir old && git -C ~/portfolio/prototypes/internetio-mobile-prototype archive <original-commit> | tar -x -C old
ln -s ~/portfolio/prototypes/internetio-mobile-prototype new
cp <this-repo>/verify/harness.* .
python3 -m http.server 5321
```

Open `http://127.0.0.1:5321/harness.html`, then in the console:

```js
await H.setup(1440); await H.suite(true)   // 1440 desktop; use 800 and 410 with suite(false)
```

`{ total: 0 }` means no difference. `page-collect.js` is the simpler single-page version used for the landing page.

## Results, 2026-09-29

| Prototype | Widths | Screens | Elements compared | Differences |
|---|---|---|---|---|
| Landing page | 390, 900, 1440 | 1 | 400 per width | 0 |
| App | 410, 800, 1440 | 18 to 19 | 2,797 to 2,918 | 0 |

A control (changing one button colour and one radius) is detected each time, so a zero is not a blind spot.
