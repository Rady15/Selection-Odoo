/**
 * Read-only catalogue profile via Odoo RPC. Tally done in JS to avoid read_group quirks.
 * Run: node tests/probe-catalog-rpc.mjs
 */
import { envValue } from '../scripts/odoo-env.mjs';

const BASE = envValue('ODOO_URL') || 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';
const DB = 'oktech24-coffee-selection-usa-staging-40504893';

let cookie = '';
async function call(model, method, args, kwargs = {}) {
  const r = await fetch(`${BASE}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { model, method, args, kwargs } }),
  });
  const d = await r.json();
  if (d.error) throw new Error(`${method}(${model}): ${d.error.data?.message || JSON.stringify(d.error).slice(0, 300)}`);
  return d.result;
}

const auth = await fetch(`${BASE}/web/session/authenticate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { db: DB, login: envValue('ODOO_LOGIN'), password: envValue('ODOO_PASSWORD') } }),
});
cookie = (auth.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
console.log(`authenticated uid=${(await auth.json()).result?.uid}`);

const DOMAIN = [['sale_ok', '=', true], ['active', '=', true]];
const all = await call('product.template', 'search_read', [DOMAIN, ['id', 'name', 'categ_id', 'default_code']]);
console.log(`\nsale_ok + active templates: ${all.length}`);

const withImgIds = new Set(await call('product.template', 'search', [[...DOMAIN, ['image_1920', '!=', false]]]));
console.log(`with image_1920: ${withImgIds.size}`);
console.log(`without image_1920: ${all.length - withImgIds.size}`);

// who has an image?
if (withImgIds.size) {
  const recs = all.filter((p) => withImgIds.has(p.id));
  console.log('\nproducts that DO have an image:');
  for (const r of recs) console.log(`  [${r.id}] ${r.name} | ${r.default_code || '-'}`);
}

// ---- category tally
const tally = new Map();
for (const p of all) {
  const key = Array.isArray(p.categ_id) ? `${p.categ_id[0]}|${p.categ_id[1]}` : 'none|(no category)';
  if (!tally.has(key)) tally.set(key, { total: 0, withImg: 0 });
  const t = tally.get(key);
  t.total++;
  if (withImgIds.has(p.id)) t.withImg++;
}
console.log('\ncategory coverage:');
for (const [key, t] of [...tally.entries()].sort((a, b) => b[1].total - a[1].total)) {
  const [id, label] = key.split('|');
  console.log(`  ${String(t.total).padStart(4)} total | ${String(t.withImg).padStart(3)} with image | [${id}] ${label}`);
}

// ---- variant-level images
const vWithImg = await call('product.product', 'search_count', [[['active', '=', true], ['image_variant_1920', '!=', false]]]);
console.log(`\nvariants with image_variant_1920: ${vWithImg}`);

// ---- sample names in the biggest category, to judge what imagery fits
const biggest = [...tally.entries()].sort((a, b) => b[1].total - a[1].total)[0];
if (biggest) {
  const [key] = biggest;
  const cid = Number(key.split('|')[0]);
  console.log(`\nsample names in "${key.split('|')[1]}" (${biggest[1].total} products):`);
  const sample = all.filter((p) => Array.isArray(p.categ_id) && p.categ_id[0] === cid).slice(0, 15);
  for (const s of sample) console.log(`  ${s.name}`);
}
