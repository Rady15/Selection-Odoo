/**
 * Read-only probe: how many public products have usable images?
 *
 * Run: node tests/probe-images.mjs
 */
const BASE = 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';

const get = async (p) => (await fetch(BASE + p)).json();

async function allProducts() {
  let all = [], page = 1;
  for (;;) {
    const j = await get(`/api/products?lang=en&limit=100&page=${page}`);
    if (!j.success) throw new Error(`page ${page}: ${JSON.stringify(j.error)}`);
    all = all.concat(j.data || []);
    if (page >= (j.meta?.pages || 1)) break;
    page++;
  }
  return all;
}

const products = await allProducts();
console.log(`products: ${products.length}`);

// ---- what image-ish fields exist at all?
const fieldCounts = {};
for (const p of products) {
  for (const [k, v] of Object.entries(p)) {
    const looksImagey = /image|photo|thumb|media|picture|img/i.test(k);
    if (looksImagey) fieldCounts[k] = (fieldCounts[k] || 0) + (v ? 1 : 0);
  }
}
console.log('\nimage-ish fields (non-empty count / total):');
for (const [k, n] of Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${n}/${products.length}`);
}

const hasAny = (p) => {
  const arr = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  return arr.length > 0 || Boolean(p.image_url) || Boolean(p.image);
};

const withImg = products.filter(hasAny);
const without = products.filter((p) => !hasAny(p));

console.log(`\nwith image:    ${withImg.length}`);
console.log(`without image: ${without.length}  (${((without.length / products.length) * 100).toFixed(1)}%)`);

// ---- breakdown of the imageless set by category
const byCat = {};
for (const p of without) {
  const names = (p.categories || []).map((c) => c.name_en || c.name || c.name_ar || '?');
  const key = names[0] || '(no category)';
  byCat[key] = (byCat[key] || 0) + 1;
}
console.log('\nimageless by first category:');
for (const [k, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(4)}  ${k}`);
}

// ---- sample of imageless products
console.log('\nfirst 20 imageless products:');
for (const p of without.slice(0, 20)) {
  console.log(`  [${p.id}] ${p.name_en || p.name_ar || '?'} | sku=${p.sku || '-'} | cats=${(p.categories || []).map((c) => c.name_en || c.name).join(', ') || '-'}`);
}

// ---- detail shape for one product with an image, one without
const sampleWith = withImg[0];
const sampleWithout = without[0];
for (const [label, p] of [['WITH image', sampleWith], ['WITHOUT image', sampleWithout]]) {
  if (!p) continue;
  const d = await get(`/api/products/${p.id}?lang=en`);
  const prod = d.data || {};
  console.log(`\n--- detail ${label}: ${prod.name_en || prod.id}`);
  const imgs = Object.entries(prod).filter(([k]) => /image|photo|thumb|media|picture|img/i.test(k));
  if (!imgs.length) console.log('  (no image-ish keys at all)');
  for (const [k, v] of imgs) {
    const val = typeof v === 'string' ? (v.length > 120 ? v.slice(0, 120) + '…' : v) : JSON.stringify(v);
    console.log(`  ${k} = ${val}`);
  }
}

// ---- does the image route actually serve bytes?
const probe = sampleWith;
if (probe) {
  const url = `${BASE}/api/images/product.template/${probe.id}`;
  const r = await fetch(url);
  console.log(`\nGET /api/images/product.template/${probe.id} -> ${r.status} ${r.headers.get('content-type')} ${r.headers.get('content-length') || '?'}B`);
}
