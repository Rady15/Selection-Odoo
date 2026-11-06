# Homepage: block rendering, hero and the `false` text bug

Covers the storefront homepage pipeline from `GET /api/homepage` to the rendered
page, plus `GET /api/categories`, which now embeds products.

---

## 1. The literal word "false" over the hero image

**Symptom.** Two hero slides and the coffee-quiz section rendered the word
`false` as visible text on top of the artwork. One slide rendered `&nbsp;`
instead.

**Cause.** Odoo serialises an *empty* CMS field as JSON `false`, not `null`:

```json
{ "type": "hero", "title": false, "body": false, "cta": { "label": false, "url": false } }
```

The transform layer did `String(value ?? '')`. `??` only catches
`null`/`undefined`, so `false` fell through to `String(false)` → `"false"`.
That string was then assigned to `subtitle_ar`/`subtitle_en` and rendered.

The `&nbsp;` case is the same bug from the other direction: rich-text bodies
arrive as `<div data-oe-version="1.2">&nbsp;</div>`. Stripping the tags leaves
the literal characters `&nbsp;`, because an entity is not whitespace.

**Fix.** `src/utils/text.ts` — one sanitiser used by the transform and by every
section component:

| helper | behaviour |
|---|---|
| `cleanText(v)` | returns `''` for `null`/`undefined`/`false`/`true`, for the stringified sentinels (`"false"`, `"null"`, `"undefined"`, `"none"`, `"nan"`), and for whitespace-only strings |
| `stripHtml(v)` | strips tags, **decodes entities**, collapses whitespace, and returns `''` when nothing readable is left (`&nbsp;`, `<p><br></p>`, `...`) |
| `pickText(...)` | first candidate with readable text |
| `cleanUrl(v)` | normalises links; maps Odoo's default `/shop` to `/products` |
| `toEmbedUrl(v)` | `youtube.com/watch?v=ID` → `youtube.com/embed/ID` (a watch URL inside an iframe fails with "YouTube refused to connect") |

Defence in depth: `AnimatedTitle` also sanitises, because it rendered
`{subtitle && …}` — `"false"` is truthy.

**Verification.** `tests/verify-homepage.mjs` walks every string in the
transformed payload and fails on any sentinel value.

---

## 2. Hero slider

**Before.** `AnimatePresence mode="wait"` unmounted the outgoing slide, waited
for its exit animation, then mounted the incoming one. That left a blank frame
between slides and restarted the image request every time — the change read as
a flash, not a fade. The incoming slide also started at `scale(1.08)`, which
produced a visible jump.

There was a second, quieter bug: the markup was `<picture><img class="w-full h-full">`.
`<picture>` is inline and has no height, so `h-full` on the child resolved
against an indefinite height and the image rendered at its natural size,
overflowing the 600 px container (measured: 1488×619 inside 1440×600).

**After.**

- All slides stay mounted, stacked `absolute inset-0`, and crossfade on
  `opacity` over 900 ms. Nothing unmounts, so nothing is ever re-fetched.
- Because every slide is in the DOM from first paint, every hero image is
  preloaded — no white flash on the first transition.
- The active slide gets a 9 s Ken Burns zoom (`scale(1) → 1.06`); inactive
  slides are reset to `scale(1)` while invisible.
- Autoplay interval comes from the CMS block (`configuration.interval`), is
  paused on hover and while the tab is in the background.
- Slide copy is rendered *inside* each slide, so the text crossfades with its
  image instead of popping in a frame later.
- When a slide has no headline (common: the banner artwork already contains the
  logo), the CTA is pinned low instead of landing on top of it.
- A slide's image walks an ordered fallback chain (`sources`) when a source
  404s or is narrower than 600 px (Odoo's placeholder is 256 px).
- The old `/hero-banners/<uuid>.png` local override is gone — that directory
  never existed, so every slide was issuing a 404.

**Verified in the browser** (`tests/verify-homepage-ui.mjs`): 2 slides mounted,
exactly one at `opacity: 1`, one at `opacity: 0`, both with
`transition-duration: 0.9s`, and the index advances after the interval.

---

## 3. Every block renders, in payload order

`GET /api/homepage` returns 10 blocks in editorial order:

| # | block type | data it carries | rendered as |
|---|---|---|---|
| 0 | `hero` | image + linked product | `hero_slider` (slide 1) |
| 1 | `hero` | image | `hero_slider` (slide 2) |
| 2 | `categories` | title | `featured_categories` |
| 3 | `products` | title + 10 products | `product_carousel` |
| 4 | `products` | title + 48 products | `product_carousel` |
| 5 | `video` | `video_url` | `video` |
| 6 | `testimonials` | title | `testimonials` |
| 7 | `newsletter` | — | `newsletter` |
| 8 | `coffee_finder` | — | `coffee_quiz` |
| 9 | `story` | — | `roastery_story` |

**What was wrong.**

- The `video` block had no entry in the type map and was silently dropped.
- Both `products` blocks were rendered by `ProductCarouselSection` fetching
  `?flag=new&limit=12` — so "كوفي كب" (10 cups) and "قهوة سيليكشن" (48 green
  beans) showed *the same twelve products*. The block's own `products` array was
  never read.
- The `categories` block ignored its own `categories` array.
- `HomePage` merged the payload into `prev`, but `prev` was initialised to `[]`,
  so the "defaults fill the rest" branch was dead code — an API failure produced
  a blank page.
- `sort_order` was re-assigned sequentially as blocks were visited, so a hero
  block that was not first would have jumped to the top.

**What it does now.** `buildHomepageSections()` in `src/utils/externalApi.ts`
emits one section per block, `sort_order = index * 10` (payload order is the
editorial order), with that block's own `products` / `categories` / `image` /
`video_url`. Consecutive hero blocks collapse into one slider. Unknown types are
dropped, never coerced into a hero.

`ProductCarouselSection` uses `config.products` when present and only falls back
to a `?flag=…` fetch when a block is configured by collection instead of by
hand. `HomePage` renders from a `DEFAULT_SECTIONS` list when the API fails, so
the page is never blank.

A hero slide with no CMS CTA gets one built from the product the editor attached
to the block — otherwise both slides render as bare images, since `title`,
`body` and `cta` are all empty. That is why slide 1 now reads
*"Timemore Coffee Server (360ml)-Black"*.

---

## 4. `GET /api/categories` now returns products

Each of the 11 categories carries a `products` array — 471 products, ~600 KB
total. The wrapper now:

- normalises every embedded product with `normalizeProduct`, so the shape is
  identical to `GET /api/products` and a category product can go straight into
  `ProductCard`;
- exposes `product_count`;
- exposes `cover_image` — `image` is `null` on all 11 categories, so the first
  product photo is used. Before this, all eleven cards rendered the *same*
  Unsplash coffee bag.
- `fetchCategories()` memoises the promise: the homepage carousel and the
  listing page both need it and would otherwise download 600 KB twice.

The listing page's category tabs fill any count the product list does not cover
from `product_count`, so a tab label can never disagree with the result count
underneath it.

---

## Verification

```
node tests/verify-homepage.mjs        # 28/28 — transform layer, live backend
node tests/verify-homepage-ui.mjs     # 27/27 — rendered page, headless Chromium
node tests/verify-listing-ui.mjs      # 12/12 — catalogue listing regression
node tests/verify-catalog-pipeline.mjs # 15/15 — catalogue regression
npx tsc --noEmit                      # clean
npx vite build                        # clean
```

---

## Known content issues (CMS data, not code)

These are visible on the staging homepage and need an editor, not a patch:

1. **Hero slide 2 is a contact sheet.** `selection.homepage.section/70b5856c…`
   is a 1536×1024 image containing **five different banner designs** (one wide
   panel on top, four below). The hero crops it into one frame, so the slide
   reads as a wall of mini-banners. Replace it with a single 16:9 banner — the
   top panel of that same sheet is the intended design.
2. **Section titles are placeholders.** The categories block is titled "فئة 2"
   and both product blocks share the body text "كوفي كبكوفي كبكوفي كبكوفي كب".
3. **Hero slide 1 has no headline.** Only the linked product's name is shown,
   because `title`, `body` and `cta` are all empty on the block.
4. **Prices are placeholders.** The catalogue spans 1–100 SAR; the Timemore
   Coffee Server shows 1.00 SAR.
