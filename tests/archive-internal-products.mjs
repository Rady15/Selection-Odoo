/**
 * Archives Odoo internal/system products so they leave the public catalog.
 *
 * Uses DELETE /api/products/{id}, which archives (active=false) rather than
 * hard-deleting — order history and accounting references survive.
 *
 * Usage:
 *   node tests/archive-internal-products.mjs --limit=1     # canary
 *   node tests/archive-internal-products.mjs               # everything remaining
 *   node tests/archive-internal-products.mjs --dry-run
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { envValue } from '../scripts/odoo-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';

const require = createRequire(import.meta.url);
const { filterPublicProducts } = require(path.join(__dirname, '.catalogPolicy.cjs'));

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const DRY = args.includes('--dry-run');

const c = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[90m', x: '\x1b[0m' };

async function api(method, p, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + p, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

async function allProducts() {
  const out = [];
  let page = 1;
  for (;;) {
    const j = (await api('GET', `/api/products?lang=en&limit=100&page=${page}`)).json;
    out.push(...(j?.data || []));
    if (page >= (j?.meta?.pages || 1)) break;
    page++;
  }
  return out;
}

// ── login ────────────────────────────────────────────────────
const login = await api('POST', '/api/auth/login', { body: { login: envValue('ODOO_LOGIN'), password: envValue('ODOO_PASSWORD') } });
const token = login.json?.data?.access_token;
if (!token) {
  console.error('login failed', login.status, login.text.slice(0, 200));
  process.exit(1);
}

// ── identify targets ─────────────────────────────────────────
const before = await allProducts();
const visible = filterPublicProducts(before);
const targets = before.filter((p) => !visible.includes(p));

// canary order: expense items first, Odoo system products (POS/loyalty-linked) last
const SYSTEM = new Set(['Tips', 'Down Payment (POS)', 'Discount', 'Gift Card', 'Top-up eWallet', 'Down payment']);

/**
 * Real merchandise that happens to be misfiled in an internal Odoo category.
 * Archiving it would hide a product customers can buy as soon as it is
 * restocked; the correct fix is to move it to a proper category in Odoo.
 * Never archive these.
 */
const MERCHANDISE_OVERRIDES = [/cafetto/i, /descaler/i, /water\s*hardness/i];
const isRealMerchandise = (p) => MERCHANDISE_OVERRIDES.some((rx) => rx.test(String(p.name)));

const skipped = targets.filter(isRealMerchandise);
const ordered = [
  ...targets.filter((p) => !isRealMerchandise(p) && !SYSTEM.has(p.name)),
  ...targets.filter((p) => !isRealMerchandise(p) && SYSTEM.has(p.name)),
];

console.log(`${c.d}before: ${before.length} products · ${targets.length} internal${c.x}`);
console.log(`${c.d}mode: ${DRY ? 'DRY RUN' : 'ARCHIVE'} · limit: ${LIMIT === Infinity ? 'all' : LIMIT}${c.x}`);
if (skipped.length) {
  console.log(`${c.y}skipping real merchandise (re-categorise in Odoo instead):${c.x}`);
  skipped.forEach((p) => console.log(`  ${c.y}·${c.x} ${p.name} ${c.d}(${p.categ_name})${c.x}`));
}
console.log('');

const results = [];
let done = 0;

for (const p of ordered) {
  if (done >= LIMIT) break;
  const tag = SYSTEM.has(p.name) ? 'system' : 'expense';

  if (DRY) {
    console.log(`  ${c.y}would archive${c.x} [${tag}] ${p.name}`);
    done++;
    continue;
  }

  const res = await api('DELETE', `/api/products/${p.id}`, { token });
  const ok = [200, 204].includes(res.status);
  results.push({ id: p.id, name: p.name, categ: p.categ_name, kind: tag, status: res.status, ok, body: res.json });

  console.log(
    ok
      ? `  ${c.g}archived${c.x} [${tag}] ${p.name} ${c.d}(${p.categ_name})${c.x}`
      : `  ${c.r}FAILED  ${c.x} [${tag}] ${p.name} ${c.d}HTTP ${res.status} ${res.json?.error?.code || ''}${c.x}`
  );
  done++;
}

// ── verify ───────────────────────────────────────────────────
if (!DRY) {
  const after = await allProducts();
  const stillInternal = after.filter((p) => !filterPublicProducts([p]).length);
  const total = (await api('GET', '/api/products?limit=1')).json?.meta?.total;

  const archived = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(`\n${c.d}────────────────────────────────────────${c.x}`);
  console.log(`archived : ${archived}`);
  console.log(`failed   : ${failed}`);
  console.log(`catalog  : ${before.length} → ${after.length}  (meta.total = ${total})`);
  console.log(`remaining internal visible: ${stillInternal.length}`);

  if (failed) {
    console.log(`\n${c.r}failures:${c.x}`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name} → HTTP ${r.status} ${r.body?.error?.code || ''} ${String(r.body?.error?.message || '').slice(0, 90)}`));
  }

  const fs = await import('node:fs');
  fs.writeFileSync(
    path.join(__dirname, 'archive-results.json'),
    JSON.stringify({ at: new Date().toISOString(), before: before.length, after: after.length, total, results }, null, 2)
  );
}
