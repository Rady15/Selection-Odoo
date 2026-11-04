/**
 * End-to-end check of the product-image upload route.
 *
 * Exercises the same code path the admin panel uses:
 *   browser → POST /api/product-image → Odoo JSON-RPC → product.template.image_1920
 *   then reads it back through the public REST API.
 *
 * Requires the dev server running:  npx vite --port 5199
 * Run: node tests/verify-product-image-route.mjs
 */
import zlib from 'node:zlib';
import { envValue } from '../scripts/odoo-env.mjs';

const ODOO = 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';
const LOCAL = process.env.LOCAL_BASE || 'http://localhost:5199';

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}${detail ? `  \x1b[90m${detail}\x1b[0m` : ''}`);
  ok ? pass++ : fail++;
};

function tinyPng() {
  const t = Array.from({ length: 256 }, (_, n) => {
    let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
  });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const ch = (ty, d) => {
    const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
    const td = Buffer.concat([Buffer.from(ty, 'ascii'), d]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([l, td, c]);
  };
  const W = 48, H = 48;
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  const rows = [];
  for (let y = 0; y < H; y++) { rows.push(Buffer.from([0])); for (let x = 0; x < W; x++) rows.push(Buffer.from([14, 82, 87])); }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ch('IHDR', ih), ch('IDAT', zlib.deflateSync(Buffer.concat(rows))), ch('IEND', Buffer.alloc(0)),
  ]);
}

const json = async (r) => { try { return await r.json(); } catch { return null; } };

console.log('\n── setup ──');
const login = await json(await fetch(`${ODOO}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login: envValue('ODOO_LOGIN'), password: envValue('ODOO_PASSWORD') }),
}));
const adminToken = login?.data?.access_token;
check('admin login', Boolean(adminToken));

const stamp = Date.now();
const created = await json(await fetch(`${ODOO}/api/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({
    name_en: `ZZ Route Test ${stamp}`, name_ar: `ZZ Route Test ${stamp}`,
    slug: `zz-route-test-${stamp}`,
    variants: [{ attributes: {}, sku: `ZZROUTE-${stamp}`, price: 10, active: true }],
  }),
}));
const productId = created?.data?.id;
check('throwaway product created', Boolean(productId), productId || JSON.stringify(created).slice(0, 150));

console.log('\n── auth guards ──');
let r = await fetch(`${LOCAL}/api/product-image`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ product_id: productId, data_base64: 'AAAA' }),
});
check('no token → 401', r.status === 401, `HTTP ${r.status}`);

r = await fetch(`${LOCAL}/api/product-image`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer not-a-real-token' },
  body: JSON.stringify({ product_id: productId, data_base64: 'AAAA' }),
});
check('bad token → 401', r.status === 401, `HTTP ${r.status}`);

r = await fetch(`${LOCAL}/api/product-image`, { method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } });
check('GET → 405', r.status === 405, `HTTP ${r.status}`);

console.log('\n── validation ──');
r = await fetch(`${LOCAL}/api/product-image`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ data_base64: 'AAAA' }),
});
check('missing product_id → 400', r.status === 400, `HTTP ${r.status}`);

r = await fetch(`${LOCAL}/api/product-image`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ product_id: productId }),
});
check('missing data_base64 → 400', r.status === 400, `HTTP ${r.status}`);

r = await fetch(`${LOCAL}/api/product-image`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ product_id: '00000000-0000-0000-0000-000000000000', data_base64: 'AAAA' }),
});
check('unknown product → 404', r.status === 404, `HTTP ${r.status}`);

console.log('\n── happy path ──');
const dataUrl = `data:image/png;base64,${tinyPng().toString('base64')}`;
r = await fetch(`${LOCAL}/api/product-image`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ product_id: productId, data_base64: dataUrl, filename: 'route-test.png' }),
});
const body = await json(r);
check('upload → 200', r.status === 200, `HTTP ${r.status} ${body?.error?.message || ''}`);
check('response carries an image url', typeof body?.data?.url === 'string' && body.data.url.includes('/api/images/'), body?.data?.url?.slice(0, 80));

console.log('\n── persisted? ──');
const detail = await json(await fetch(`${ODOO}/api/products/${productId}?lang=en`));
check('public API returns the new image', typeof detail?.data?.image === 'string' && detail.data.image.length > 0, String(detail?.data?.image).slice(0, 90));

const imgRes = await fetch(`${ODOO}/api/images/product.template/${productId}`);
const bytes = Buffer.from(await imgRes.arrayBuffer());
check('image route serves bytes', imgRes.status === 200 && bytes.length > 0, `HTTP ${imgRes.status} ${imgRes.headers.get('content-type')} ${bytes.length}B`);
check('served bytes are a PNG', bytes[0] === 0x89 && bytes[1] === 0x50, `magic ${bytes.subarray(0, 4).toString('hex')}`);

console.log('\n── cleanup ──');
r = await fetch(`${ODOO}/api/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
check('throwaway product archived', r.status === 200, `HTTP ${r.status}`);

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
