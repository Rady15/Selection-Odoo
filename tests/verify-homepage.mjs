/**
 * Verifies the homepage pipeline: CMS blocks -> HomepageSection[].
 *
 * Runs the real browser wrapper (installExternalApi) against the live staging
 * backend, so this checks exactly what the storefront receives.
 *
 * What it guards:
 *   - the literal string "false" / "&nbsp;" never reaches the UI (Odoo
 *     serialises an empty CMS field as JSON `false`)
 *   - every block is rendered, in payload order, including `video`
 *   - each `products` block keeps its own product list instead of sharing one
 *     `?flag=new` fetch
 *   - `/api/categories` products are normalised and counted
 *
 * Run: node tests/verify-homepage.mjs
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', '.homepage.cjs');
const ENTRY = path.join(ROOT, 'tests', '.homepage-entry.ts');
const BASE = 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; console.log(`  \x1b[31m✗\x1b[0m ${name} ${detail ? '\x1b[2m' + detail + '\x1b[0m' : ''}`); }
};
const section = (name) => console.log(`\n\x1b[1m${name}\x1b[0m`);

fs.writeFileSync(ENTRY, [
  "export { installExternalApi } from '../src/utils/externalApi';",
  "export { fetchCategories } from '../src/utils/catalogApi';",
].join('\n'));

execFileSync(process.execPath, [
  path.join(ROOT, 'node_modules', 'esbuild', 'bin', 'esbuild'),
  ENTRY,
  '--bundle', '--format=cjs', '--platform=node',
  `--outfile=${OUT}`,
  '--log-level=error',
  `--define:import.meta.env.VITE_API_BASE_URL="${BASE}"`,
  '--define:import.meta.env.DEV="false"',
  '--define:import.meta.env.PROD="true"',
], { cwd: ROOT, stdio: 'inherit' });

globalThis.window = globalThis;
globalThis.location = new URL(BASE);
globalThis.localStorage = {
  _v: {},
  getItem(k) { return this._v[k] ?? null; },
  setItem(k, v) { this._v[k] = String(v); },
  removeItem(k) { delete this._v[k]; },
};

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const { installExternalApi, fetchCategories } = require(OUT);

const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, init) =>
  nativeFetch(typeof input === 'string' && input.startsWith('/') ? `${BASE}${input}` : input, init);

installExternalApi();

// An empty string is the *correct* value for a blank CMS field. These are the
// sentinels that used to leak through as visible text.
const BAD_TOKENS = /^(false|null|undefined|none|nil|nan|&nbsp;)$/i;
const isBad = (v) => typeof v === 'string' && BAD_TOKENS.test(v.trim());

const scanStrings = (value, pathStr = 'root', hits = []) => {
  if (typeof value === 'string') {
    if (isBad(value)) hits.push(`${pathStr} = ${JSON.stringify(value)}`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanStrings(v, `${pathStr}[${i}]`, hits));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) scanStrings(v, `${pathStr}.${k}`, hits);
  }
  return hits;
};

const res = await fetch('/api/homepage');
const sections = await res.json();

section('Homepage sections');
ok('payload is an array', Array.isArray(sections), `got ${typeof sections}`);
ok('renders at least 9 sections', Array.isArray(sections) && sections.length >= 9, `got ${sections?.length}`);
if (!Array.isArray(sections)) process.exit(1);

const types = sections.map((s) => s.type);
console.log('  \x1b[2morder: ' + types.join(' → ') + '\x1b[0m');

const expected = ['hero_slider', 'featured_categories', 'product_carousel', 'product_carousel', 'video'];
ok('hero comes first', types[0] === 'hero_slider', types[0]);
ok('categories block follows the hero', types[1] === 'featured_categories', types[1]);
ok('both products blocks are present', types.filter((t) => t === 'product_carousel').length === 2);
ok('the video block is no longer dropped', types.includes('video'));
ok('story block is present', types.includes('roastery_story'));
ok('coffee finder block is present', types.includes('coffee_quiz'));

const orders = sections.map((s) => s.sort_order);
ok(
  'sort_order is strictly ascending (payload order preserved)',
  orders.every((n, i) => i === 0 || n > orders[i - 1]),
  orders.join(',')
);

section('No literal "false" / "&nbsp;" text');
const titleHits = [];
for (const s of sections) {
  for (const key of ['title_ar', 'title_en', 'subtitle_ar', 'subtitle_en', 'cta_label']) {
    if (isBad(s[key])) titleHits.push(`${s.type}.${key}`);
  }
}
ok('no section carries a "false" title or subtitle', titleHits.length === 0, titleHits.join(', '));

const hero = sections.find((s) => s.type === 'hero_slider');
const slides = hero?.config?.slides || [];
ok('hero has 2 slides', slides.length === 2, `got ${slides.length}`);
const slideHits = scanStrings(slides, 'slides');
ok('no hero slide field is "false"', slideHits.length === 0, slideHits.slice(0, 4).join(', '));
ok(
  'hero slides have empty (not "false") subtitles',
  slides.every((s) => s.subtitle_ar === '' || /[\p{L}\p{N}]/u.test(s.subtitle_ar)),
  JSON.stringify(slides.map((s) => s.subtitle_ar))
);
ok(
  'each hero slide has an image source',
  slides.every((s) => typeof s.image_desktop === 'string' && s.image_desktop.startsWith('http')),
  JSON.stringify(slides.map((s) => s.image_desktop))
);

section('Hero shows the data attached to its blocks');
const linkedProduct = slides[0]?.cta_link || '';
ok('slide 1 links to its linked product', /^\/product\//.test(linkedProduct), linkedProduct);
ok('slide 1 CTA label is the product name', Boolean(slides[0]?.cta_text_en), slides[0]?.cta_text_en);
ok('hero autoplay interval is a number', Number.isFinite(hero?.config?.interval), String(hero?.config?.interval));

section('Product carousels keep their own products');
const carousels = sections.filter((s) => s.type === 'product_carousel');
const counts = carousels.map((c) => (Array.isArray(c.config?.products) ? c.config.products.length : -1));
console.log('  \x1b[2mproduct counts: ' + counts.join(', ') + '\x1b[0m');
ok('both carousels carry products', counts.every((n) => n > 0), counts.join(','));
ok(
  'the two carousels are different sets',
  carousels.length === 2 &&
    JSON.stringify(carousels[0].config.products.map((p) => p.id)) !==
      JSON.stringify(carousels[1].config.products.map((p) => p.id))
);
ok(
  'embedded products are normalised (price is a number)',
  carousels.every((c) => c.config.products.every((p) => typeof p.price === 'number')),
  JSON.stringify(carousels.map((c) => typeof c.config.products[0]?.price))
);

section('Video');
const video = sections.find((s) => s.type === 'video');
ok('video block has an embeddable URL', /youtube\.com\/embed\/[\w-]+/.test(video?.config?.video_url || ''), video?.config?.video_url);
const story = sections.find((s) => s.type === 'roastery_story');
ok('story video_url is empty, not false', story?.config?.video_url === '', JSON.stringify(story?.config?.video_url));

section('Categories now embed their products');
const cats = await fetchCategories();
ok('categories endpoint returns 11 categories', cats.length === 11, String(cats.length));
ok('every category carries products', cats.every((c) => Array.isArray(c.products) && c.products.length > 0));
ok('every category has a product_count', cats.every((c) => c.product_count === c.products.length));
ok('every category has a cover image', cats.every((c) => typeof c.cover_image === 'string' && c.cover_image.startsWith('http')), JSON.stringify(cats.map((c) => c.cover_image).slice(0, 2)));
ok('embedded category products are normalised', cats.every((c) => c.products.every((p) => typeof p.price === 'number' && typeof p.slug === 'string')));
const total = cats.reduce((n, c) => n + c.product_count, 0);
ok('category products total 400+', total > 400, String(total));

console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
