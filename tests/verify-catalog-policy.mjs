/**
 * Verifies src/utils/catalogPolicy.ts against the live backend.
 *
 * After the internal records were archived in Odoo, the catalogue is expected to
 * be clean — the policy is now a defence-in-depth net that must hide nothing.
 *
 * Run:
 *   npx esbuild src/utils/catalogPolicy.ts --format=cjs --outfile=tests/.catalogPolicy.cjs
 *   node tests/verify-catalog-policy.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';

const require = createRequire(import.meta.url);
const { filterPublicProducts, isInternalProduct } = require(path.join(__dirname, '.catalogPolicy.cjs'));

const SYSTEM = ['Tips', 'Down Payment (POS)', 'Discount', 'Gift Card', 'Top-up eWallet', 'Down payment'];
const EXPENSES = ['Expenses', 'Gas Expenses', 'Petrol Expenses', 'VISA Renewal', 'Penalties / Fines', 'Others'];

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}${detail ? `  \x1b[90m${detail}\x1b[0m` : ''}`);
  ok ? pass++ : fail++;
};
const get = async (p) => (await fetch(BASE + p)).json();
const purchasable = (p) => (p.variants || []).some((v) => v.purchasable === true);

async function allProducts() {
  let all = [], page = 1;
  for (;;) {
    const j = await get(`/api/products?lang=en&limit=100&page=${page}`);
    all = all.concat(j.data || []);
    if (page >= (j.meta?.pages || 1)) break;
    page++;
  }
  return all;
}

console.log('\n── backend state (after archiving) ──');
const all = await allProducts();
const total = (await get('/api/products?limit=1')).meta?.total;

check('system products no longer returned', !all.some((p) => SYSTEM.includes(p.name)),
  SYSTEM.filter((n) => all.some((p) => p.name === n)).join(', ') || 'none');
check('expense lines no longer returned', !all.some((p) => EXPENSES.includes(p.name)),
  EXPENSES.filter((n) => all.some((p) => p.name === n)).join(', ') || 'none');
check('meta.total matches the returned catalogue', total === all.length, `${total} vs ${all.length}`);

console.log('\n── policy is now a no-op net ──');
const visible = filterPublicProducts(all);
const removed = all.filter((p) => !visible.includes(p));
check('policy hides nothing on a clean backend', removed.length === 0,
  removed.map((p) => p.name).join(', ') || 'nothing hidden');

// ── the safety invariant ─────────────────────────────────────
console.log('\n── safety invariant ──');
check('no purchasable product is ever hidden', removed.filter(purchasable).length === 0,
  removed.filter(purchasable).map((p) => p.name).join(', ') || 'holds');

// ── real merchandise that lives in an "internal" category ────
console.log('\n── real merchandise preserved ──');
for (const n of ['KIT WATER HARDNESS', 'Cafetto LOD Black High Performance Descaler 500ml']) {
  if (all.some((p) => p.name === n)) check(`"${n}" still in catalogue`, visible.some((p) => p.name === n));
}
const cafetto = all.find((p) => /5Liter/i.test(p.name));
if (cafetto) check('out-of-stock Cafetto 5L not hidden by the frontend', visible.some((p) => p.id === cafetto.id), cafetto.name);

// ── search ───────────────────────────────────────────────────
console.log('\n── search ──');
for (const qs of ['q=tips', 'q=discount', 'q=gift', 'q=wallet', 'q=expenses', 'q=visa', 'q=penalties']) {
  const raw = (await get(`/api/products?lang=en&limit=100&${qs}`)).data || [];
  const shown = filterPublicProducts(raw);
  const dirty = shown.filter((p) => isInternalProduct(p) || SYSTEM.includes(p.name) || EXPENSES.includes(p.name));
  check(`search "${qs}" clean`, dirty.length === 0, `${raw.length} results`);
}

// ── the guard still works when a system product reappears ────
console.log('\n── guard still fires (regression protection) ──');
check('blocks a re-appearing "Tips"',
  isInternalProduct({ name: 'Tips', categ_name: 'All / Saleable / PoS', variants: [{ purchasable: false }] }) === true);
check('blocks a re-appearing "Gift Card"', isInternalProduct({ name: 'Gift Card', categ_name: 'All', variants: [] }) === true);
check('blocks a re-appearing POS product', isInternalProduct({ name: 'Any', categ_name: 'All / Saleable / PoS', variants: [] }) === true);
check('honours a backend is_internal flag', isInternalProduct({ name: 'X', is_internal: true }) === true);

// ── false-positive guards ────────────────────────────────────
console.log('\n── false-positive guards ──');
check('sellable product in Expenses category kept',
  isInternalProduct({ name: 'Real Descaler', categ_name: 'All / Expenses', variants: [{ purchasable: true }] }) === false);
check('product named "Discounted Sampler" kept',
  isInternalProduct({ name: 'Discounted Sampler', categories: [{ id: 'x' }], variants: [] }) === false);
check('product in "Merchandize" kept',
  isInternalProduct({ name: 'Cup', categ_name: 'Merchandize', categories: [], variants: [] }) === false);
check('Arabic "قهوة مختصة" kept', isInternalProduct({ name: 'قهوة مختصة', variants: [] }) === false);
check('bare "All" category not internal',
  isInternalProduct({ name: 'Real Cup', categ_name: 'All', categories: [], variants: [] }) === false);
check('empty payload safe', isInternalProduct(null) === false && filterPublicProducts([]).length === 0);

console.log(`\n${pass}/${pass + fail} checks passed${fail ? ` · \x1b[31m${fail} failed\x1b[0m` : ''}\n`);
process.exitCode = fail ? 1 : 0;
