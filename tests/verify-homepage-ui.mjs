/**
 * Browser-level verification of the storefront homepage.
 *
 * Boots nothing itself — point it at a running dev server:
 *   npm run dev            (or npx vite --port 5199 --host 127.0.0.1)
 *   node tests/verify-homepage-ui.mjs [url]
 *
 * Checks the three things that were broken:
 *   1. no literal "false" / "&nbsp;" text rendered anywhere
 *   2. every CMS block renders, in the order the API returned it
 *   3. the hero crossfades (all slides mounted, opacity transition) instead of
 *      unmounting between frames
 */

import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5199/';
const CHROME = process.env.CHROME_PATH || undefined;

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; console.log(`  \x1b[31m✗\x1b[0m ${name} ${detail ? '\x1b[2m' + detail + '\x1b[0m' : ''}`); }
};
const section = (name) => console.log(`\n\x1b[1m${name}\x1b[0m`);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
// The categories payload is ~600 KB and carries every product, so give the
// page real time before asserting on rendered content.
await page.waitForSelector('[data-testid="hero-slider"]', { timeout: 30000 });
await page.waitForSelector('[data-testid="category-card"]', { timeout: 30000 });
await page.waitForTimeout(2500);

section('No literal "false" / "&nbsp;" text');
const bodyText = await page.evaluate(() => document.body.innerText);
const badHits = bodyText.split('\n').map((l) => l.trim()).filter((l) => /^(false|null|undefined|&nbsp;|none)$/i.test(l));
ok('no line reads "false"/"null"/"&nbsp;"', badHits.length === 0, badHits.slice(0, 5).join(' | '));
ok('the word "false" never appears', !/\bfalse\b/i.test(bodyText), (bodyText.match(/.{0,40}\bfalse\b.{0,40}/i) || [''])[0]);
ok('"&nbsp;" never appears', !bodyText.includes('&nbsp;'));

section('Blocks render in payload order');
const order = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-section-type]')).map((el) => ({
    type: el.getAttribute('data-section-type'),
    order: Number(el.getAttribute('data-sort-order')),
  }))
);
console.log('  \x1b[2m' + order.map((o) => o.type).join(' → ') + '\x1b[0m');
const types = order.map((o) => o.type);
ok('hero renders first', types[0] === 'hero_slider', types[0]);
ok('categories follow the hero', types[1] === 'featured_categories', types[1]);
ok('both product blocks render', types.filter((t) => t === 'product_carousel').length === 2);
ok('the video block renders', types.includes('video'));
ok('testimonials / newsletter / quiz / story all render',
  ['testimonials', 'newsletter', 'coffee_quiz', 'roastery_story'].every((t) => types.includes(t)),
  types.join(','));
ok('sort_order ascends down the page', order.every((o, i) => i === 0 || o.order >= order[i - 1].order));

section('Hero crossfade');
const hero = await page.evaluate(() => {
  const root = document.querySelector('[data-testid="hero-slider"]');
  if (!root) return null;
  const slides = Array.from(root.querySelectorAll('[data-slide-index]')).map((el) => {
    const cs = getComputedStyle(el);
    return {
      index: Number(el.getAttribute('data-slide-index')),
      active: el.getAttribute('data-active') === 'true',
      opacity: Number(cs.opacity),
      transitionDuration: cs.transitionDuration,
      hasImage: !!el.querySelector('img'),
    };
  });
  return { count: slides.length, slides };
});
ok('both hero slides stay mounted', hero?.count === 2, String(hero?.count));
ok('exactly one slide is visible', hero?.slides.filter((s) => s.active).length === 1);
ok('the visible slide has opacity 1', hero?.slides.some((s) => s.active && s.opacity === 1));
ok('the hidden slide has opacity 0', hero?.slides.some((s) => !s.active && s.opacity === 0));
ok(
  'slides animate opacity over ~0.9s (a fade, not a swap)',
  hero?.slides.every((s) => s.transitionDuration === '0.9s'),
  hero?.slides.map((s) => s.transitionDuration).join(',')
);
ok('every slide has its image mounted (preloaded)', hero?.slides.every((s) => s.hasImage));

const activeBefore = hero?.slides.findIndex((s) => s.active);
await page.waitForTimeout(7200);
const activeAfter = await page.evaluate(() => {
  const root = document.querySelector('[data-testid="hero-slider"]');
  return Array.from(root.querySelectorAll('[data-slide-index]')).findIndex(
    (el) => el.getAttribute('data-active') === 'true'
  );
});
ok('autoplay advances the slide', activeAfter !== activeBefore, `${activeBefore} -> ${activeAfter}`);

section('Hero shows the data attached to its block');
const heroText = await page.evaluate(() => document.querySelector('[data-testid="hero-slider"]').innerText);
ok('the linked product name is the call to action', /Timemore|Coffee Server/i.test(heroText), heroText.replace(/\n/g, ' | ').slice(0, 120));
const ctaCount = await page.evaluate(() =>
  document.querySelectorAll('[data-testid="hero-slider"] button').length
);
ok('hero has working controls (arrows + dots + CTA)', ctaCount >= 3, String(ctaCount));

section('Category cards use the products now returned by /api/categories');
const cats = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-testid="category-card"]')).map((el) => ({
    text: el.innerText.replace(/\n/g, ' | '),
    // `src`, not `currentSrc`: the horizontal track lazily loads cards that are
    // still off-screen, so currentSrc is empty for most of them.
    img: el.querySelector('img')?.getAttribute('src') || '',
  }))
);
ok('11 category cards render', cats.length === 11, String(cats.length));
ok('every card shows a product count', cats.every((c) => /\d+\s*(منتج|product)/.test(c.text)), cats[0]?.text);
ok('cards use real cover images', cats.every((c) => c.img.startsWith('http')), cats[0]?.img?.slice(0, 60));
const distinctCovers = new Set(cats.map((c) => c.img)).size;
ok('cards no longer share one stock photo', distinctCovers >= 8, `${distinctCovers} distinct`);

section('Product carousels show their own products');
const carousels = await page.evaluate(() => {
  const blocks = Array.from(document.querySelectorAll('[data-section-type="product_carousel"]'));
  return blocks.map((b) => ({
    title: (b.querySelector('h2')?.innerText || '').replace(/\n/g, ' '),
    firstCards: Array.from(b.querySelectorAll('[data-testid="product-card"]'))
      .slice(0, 3)
      .map((c) => c.getAttribute('data-product-slug') || c.innerText.slice(0, 30)),
  }));
});
ok('two carousels rendered', carousels.length === 2, String(carousels.length));
ok('each carousel has cards', carousels.every((c) => c.firstCards.length > 0), JSON.stringify(carousels.map((c) => c.firstCards.length)));
ok(
  'the two carousels show different products',
  carousels.length === 2 && JSON.stringify(carousels[0].firstCards) !== JSON.stringify(carousels[1].firstCards),
  JSON.stringify(carousels.map((c) => c.firstCards[0]))
);

section('Video block');
const video = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="homepage-video"]');
  if (!el) return null;
  return { hasPoster: !!el.querySelector('img'), hasPlay: !!el.querySelector('button') };
});
ok('video block renders with a poster and a play control', video?.hasPoster && video?.hasPlay, JSON.stringify(video));

section('Runtime errors');
const realErrors = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
ok('no console or page errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

await page.screenshot({ path: 'tests/homepage-top.png' });
await page.screenshot({ path: 'tests/homepage-full.png', fullPage: true });

await browser.close();
console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
