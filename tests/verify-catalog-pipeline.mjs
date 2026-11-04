/**
 * Verifies the storefront catalogue pipeline end to end, in Node.
 *
 * The app talks to Odoo through a `window.fetch` wrapper (installExternalApi)
 * that unwraps the `{success, data, meta}` envelope and normalises products.
 * That wrapper is browser code, so it is bundled here with esbuild and run
 * against the live staging backend — the same path the UI takes.
 *
 * Run: node tests/verify-catalog-pipeline.mjs
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', '.catalogApi.cjs');
const ENTRY = path.join(ROOT, 'tests', '.pipeline-entry.ts');
const BASE = 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; console.log(`  \x1b[31m✗\x1b[0m ${name} ${detail ? '\x1b[2m' + detail + '\x1b[0m' : ''}`); }
};

// ── bundle the browser modules ──
fs.writeFileSync(ENTRY, [
  "export { installExternalApi } from '../src/utils/externalApi';",
  "export { fetchAllProducts, fetchCategories } from '../src/utils/catalogApi';",
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

// Minimal browser surface the wrapper touches.
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
const { installExternalApi, fetchAllProducts, fetchCategories } = require(OUT);

// The wrapper deliberately keeps same-origin relative paths and lets the
// browser resolve them (Vite proxy / Vercel rewrites). Node has no document
// base, so resolve `/api/*` against the staging host before the wrapper wraps
// this shim.
const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, init) =>
  nativeFetch(typeof input === 'string' && input.startsWith('/') ? `${BASE}${input}` : input, init);

console.log('\n\x1b[1mCatalogue pipeline verification\x1b[0m');

installExternalApi();

const run = async () => {
  // ── 1. full catalogue ──
  const all = await fetchAllProducts();
  ok('fetchAllProducts returns the whole catalogue', all.length > 400, `${all.length} items`);
  ok('no duplicate ids', new Set(all.map((p) => p.id)).size === all.length);
  ok('more than one page was fetched', all.length > 100, `${all.length} > 100`);

  // ── 2. categories ──
  const cats = await fetchCategories();
  ok('categories resolve to an array', Array.isArray(cats) && cats.length > 5, `${cats.length} categories`);

  // ── 3. every product carries a category slug ──
  const withSlug = all.filter((p) => p.category_slug);
  ok('products expose category_slug', withSlug.length > all.length - 5, `${withSlug.length}/${all.length}`);

  const slugSet = new Set(cats.map((c) => c.slug));
  const orphans = all.filter((p) => p.category_slug && !slugSet.has(p.category_slug));
  ok('every product slug maps to a known category', orphans.length === 0, `${orphans.length} orphans`);

  // ── 4. category counts agree with the API filter ──
  const bySlug = new Map();
  for (const p of all) {
    if (!p.category_slug) continue;
    bySlug.set(p.category_slug, (bySlug.get(p.category_slug) || 0) + 1);
  }
  let mismatch = 0;
  for (const c of cats) {
    const viaClient = bySlug.get(c.slug) || 0;
    const res = await fetch(`/api/products?category=${c.slug}&limit=1`);
    const total = Number(res.headers.get('x-catalog-total'));
    const viaServer = Number.isFinite(total) && total > 0 ? total : -1;
    // The server total counts every published product; the client list is
    // post-policy. A small delta is expected, a large one is a bug.
    if (viaServer < 0 || Math.abs(viaServer - viaClient) > 5) {
      mismatch++;
      console.log(`     \x1b[33m${c.slug}: client ${viaClient} vs server ${viaServer}\x1b[0m`);
    }
  }
  ok('client counts match the server filter', mismatch === 0, `${mismatch} mismatched categories`);

  // ── 5. server-side search uses `q`, not `search` ──
  const q = await fetch('/api/products?q=grinder&limit=5').then((r) => r.json());
  ok('?q= performs a real search', Array.isArray(q) && q.length > 0 && q.length <= 5,
    `${Array.isArray(q) ? q.length : 'n/a'} results`);
  const namesMatch = Array.isArray(q) && q.every((p) => /grind/i.test(p.name_en || p.name_ar || ''));
  ok('search results are relevant', namesMatch);

  // The backend only understands `q`; the API wrapper aliases `search` onto it
  // for the legacy callers. Both must keep working.
  const aliased = await fetch('/api/products?search=grinder&limit=1').then((r) => r.json());
  const aliasedName = aliased?.[0]?.name_en || aliased?.[0]?.name_ar || '';
  ok('?search= is aliased to ?q= by the wrapper',
    Array.isArray(aliased) && aliased.length === 1 && /grind/i.test(aliasedName), aliasedName);

  const rawSearch = await nativeFetch(`${BASE}/api/products?search=grinder&limit=1`).then((r) => r.json());
  ok('backend itself ignores ?search= (so the alias must stay)',
    (rawSearch?.meta?.total ?? 0) > 100, `total ${rawSearch?.meta?.total}`);

  // ── 6. flag filters ──
  for (const flag of ['new', 'featured']) {
    const r = await fetch(`/api/products?flag=${flag}&limit=50`).then((x) => x.json());
    ok(`flag=${flag} filters`, Array.isArray(r) && r.length > 0 && r.length < 50, `${r.length} items`);
  }

  // ── 7. no internal/system products leaked ──
  const banned = /^(tips|down payment|discount|gift card|top-?up ewallet)$/i;
  const leaked = all.filter((p) => banned.test(String(p.name_en || '').trim()));
  ok('no internal Odoo products in the public list', leaked.length === 0, leaked.map((p) => p.name_en).join(', '));

  // ── 8. images ──
  const withImage = all.filter((p) => p.images?.[0]);
  ok('products carry an image url', withImage.length === all.length, `${withImage.length}/${all.length}`);

  console.log(`\n  ${fail === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => {
  console.error('\n\x1b[31mfailed:\x1b[0m', e.message, '\n');
  process.exit(1);
});

process.on('exit', () => {
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
});
