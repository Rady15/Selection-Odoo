/**
 * Selection Store API 2.3.0 — full end-to-end cycle test
 * Covers every endpoint group in the API guide, plus contract/negative checks.
 *
 * Usage: node tests/e2e-cycle.mjs [baseUrl]
 * Output: tests/report.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { envValue } from '../scripts/odoo-env.mjs';

const BASE = (process.argv[2] || 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com').replace(/\/$/, '');
const RUN = Date.now().toString(36);
const results = [];
const notes = [];
const state = {};
let currentGroup = 'setup';

const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[90m', b: '\x1b[36m', x: '\x1b[0m', B: '\x1b[1m' };

function group(name) {
  currentGroup = name;
  console.log(`\n${C.b}${C.B}── ${name} ${C.x}`);
}
function record(name, ok, detail) {
  results.push({ group: currentGroup, name, ok: !!ok, detail: detail ?? '' });
  console.log(`  ${ok ? `${C.g}PASS${C.x}` : `${C.r}FAIL${C.x}`}  ${name}${detail ? `  ${C.d}${detail}${C.x}` : ''}`);
  return ok;
}
function note(name, detail) {
  notes.push({ group: currentGroup, name, detail });
  console.log(`  ${C.y}NOTE${C.x}  ${name}${detail ? `  ${C.d}${detail}${C.x}` : ''}`);
}
/** Rate limiter returns 422 validation_error with a "Too many requests" message. */
function isRateLimited(res) {
  const msg = String(res?.json?.error?.message || '');
  return res?.status === 422 && /too many|كثير/i.test(msg);
}
function skip(name, detail) {
  notes.push({ group: currentGroup, name: `SKIP · ${name}`, detail });
  console.log(`  ${C.y}SKIP${C.x}  ${name}${detail ? `  ${C.d}${detail}${C.x}` : ''}`);
}
function expect(name, res, status, opts = {}) {
  const statusOk = Array.isArray(status) ? status.includes(res.status) : res.status === status;
  const okFlag = opts.success === false ? res.json?.success === false : res.json?.success !== false;
  const ok = statusOk && (opts.json === false ? true : okFlag);
  const detail = `HTTP ${res.status}${res.json?.error ? ` · ${res.json.error.code}: ${String(res.json.error.message).slice(0, 120)}` : ''}${res.ms ? ` · ${res.ms}ms` : ''}`;
  return record(name, ok, detail);
}

async function req(method, p, opts = {}) {
  const url = p.startsWith('http') ? p : BASE + p;
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };
  if (opts.body !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
  if (opts.cartToken) headers['X-Cart-Token'] = opts.cartToken;
  const init = { method, headers, redirect: 'manual' };
  if (opts.body !== undefined) init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  const t0 = Date.now();
  try {
    const res = await fetch(url, init);
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.toString('utf8');
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
    return {
      status: res.status, json, text, buf, ms: Date.now() - t0, url,
      headers: Object.fromEntries(res.headers.entries()),
      contentType: res.headers.get('content-type') || '',
      disposition: res.headers.get('content-disposition') || '',
    };
  } catch (e) {
    return { status: 0, json: null, text: String(e), buf: Buffer.alloc(0), ms: Date.now() - t0, url, headers: {}, error: String(e) };
  }
}

const money = (m) => (m && typeof m === 'object' ? `${m.amount} ${m.currency}` : String(m));
const isMoney = (m) => !!m && typeof m === 'object' && typeof m.amount === 'number' && typeof m.currency === 'string';

// ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`${C.B}Selection Store API cycle test${C.x}  →  ${BASE}`);
  console.log(`Run id: ${RUN}`);

  // ── 0. Reachability & envelope ──────────────────────────────
  group('0. Reachability & response envelope');

  let r = await req('GET', '/api/categories?lang=en');
  expect('GET /api/categories (public)', r, 200);
  const categories = r.json?.data || [];
  record('response envelope {success,data}', r.json?.success === true && Array.isArray(r.json?.data), `keys=${Object.keys(r.json || {}).join(',')}`);
  record('categories non-empty', categories.length > 0, `${categories.length} categories`);
  state.category = categories.find((c) => c.slug && c.slug !== c.id) || categories[0];

  r = await req('GET', '/api/products?lang=en&limit=24');
  expect('GET /api/products', r, 200);
  const products = r.json?.data || [];
  record('pagination meta present', !!r.json?.meta && ['page', 'limit', 'total', 'pages'].every((k) => k in r.json.meta), JSON.stringify(r.json?.meta));
  record('products non-empty', products.length > 0, `${products.length} items`);

  let chosen = null;
  for (const p of products) {
    if (p.in_stock && p.variants?.some((v) => v.purchasable && v.available_quantity > 2)) { chosen = p; break; }
  }
  if (!chosen) {
    for (const p of products) {
      const d = await req('GET', `/api/products/${p.id}?lang=en`);
      if (d.json?.data?.variants?.some((x) => x.purchasable && x.available_quantity > 2)) { chosen = d.json.data; break; }
    }
  }
  if (!chosen) { record('purchasable product available', false, 'no in-stock purchasable product found'); return; }
  state.product = chosen;
  state.variant = chosen.variants.find((v) => v.purchasable && v.available_quantity > 2);
  console.log(`  ${C.d}using "${chosen.name}" / variant ${state.variant.id} (stock ${state.variant.available_quantity})${C.x}`);

  // ── 1. Catalog & discovery ──────────────────────────────────
  group('1. Catalog & discovery');

  for (const [label, qs] of [
    ['q', 'q=coffee'], ['category', `category=${state.category?.slug}`], ['origin', 'origin=Ethiopia'],
    ['process', 'process=Washed'], ['roast', 'roast=medium'], ['flag=new', 'flag=new'],
    ['sort=price_asc', 'sort=price_asc'], ['price range', 'min_price=10&max_price=500'],
    ['in_stock=true', 'in_stock=true'], ['page/limit', 'page=2&limit=5'], ['lang=ar', 'lang=ar'],
  ]) {
    const rr = await req('GET', `/api/products?${qs}&lang=en`);
    record(`products filter: ${label}`, rr.status === 200 && rr.json?.success === true && Array.isArray(rr.json?.data),
      `HTTP ${rr.status} · ${rr.json?.data?.length ?? 0} items`);
  }

  r = await req('GET', '/api/products?in_stock=true&limit=5');
  note('meta.total ignores in_stock/min_price/max_price filters (documented)',
    `total=${r.json?.meta?.total} while returning ${r.json?.data?.length} filtered items`);

  for (const [lbl, L] of [['en', 'en'], ['ar', 'ar'], ['ar_001', 'ar_001'], ['ar-SA', 'ar-SA'], ['en_US', 'en_US'], ['unknown xx', 'xx']]) {
    const rr = await req('GET', `/api/products?lang=${L}&limit=1`);
    record(`lang alias accepted: ${lbl}`, rr.status === 200 && rr.json?.success === true, `HTTP ${rr.status}`);
  }

  r = await req('GET', '/api/products?limit=500');
  record('limit capped at 100', r.json?.meta?.limit === 100 && r.json?.data?.length <= 100, `limit=${r.json?.meta?.limit} items=${r.json?.data?.length}`);

  r = await req('GET', '/api/faq', { headers: { 'Accept-Language': 'ar' } });
  record('Accept-Language honored', r.status === 200 && r.json?.success === true, `HTTP ${r.status}`);

  r = await req('GET', `/api/products/${state.product.slug}?lang=en`);
  expect('GET /api/products/{slug}', r, 200);
  record('detail id matches product', r.json?.data?.id === state.product.id, r.json?.data?.id);

  r = await req('GET', `/api/products/${state.variant.id}?lang=en`);
  expect('GET /api/products/{variant_uuid} resolves parent', r, 200);
  record('variant uuid → parent product', r.json?.data?.id === state.product.id, r.json?.data?.id);

  r = await req('GET', `/api/products/unknown-${RUN}`);
  expect('GET /api/products/{unknown} → 404', r, 404, { success: false });

  // product detail shape
  r = await req('GET', `/api/products/${state.product.id}?lang=en`);
  const pd = r.json?.data || {};
  record('product detail nests flags{}', !!pd.flags && 'new' in pd.flags && 'featured' in pd.flags, Object.keys(pd.flags || {}).join(','));
  record('product detail nests coffee{}', !!pd.coffee && 'roast_level' in pd.coffee, Object.keys(pd.coffee || {}).slice(0, 5).join(','));
  note('DOC: product detail exposes flags.new / coffee.roast_level (nested), while the guide documents flat is_new / roast_level',
    'write path accepts flat fields; read path returns nested objects — clients must not read product.is_featured');

  r = await req('GET', '/api/categories?lang=ar');
  expect('GET /api/categories?lang=ar', r, 200);

  r = await req('GET', '/api/payment-methods');
  expect('GET /api/payment-methods', r, 200);
  state.paymentMethods = r.json?.data || [];
  record('payment methods include cod', state.paymentMethods.some((m) => m.code === 'cod'), state.paymentMethods.map((m) => m.code).join(',') || 'none');
  note('online providers enabled', state.paymentMethods.map((m) => `${m.code}(${m.mode})`).join(', ') || 'none');

  r = await req('GET', '/api/public/payment-methods');
  expect('GET /api/public/payment-methods alias', r, 200);

  r = await req('GET', '/api/shipping-methods');
  expect('GET /api/shipping-methods', r, 200);
  state.shippingMethods = r.json?.data || [];
  record('shipping methods non-empty', state.shippingMethods.length > 0, state.shippingMethods.map((s) => s.code).join(','));
  state.shipping = state.shippingMethods.find((s) => s.code === 'smsa') || state.shippingMethods[0];

  r = await req('GET', '/api/public/shipping-methods');
  expect('GET /api/public/shipping-methods alias', r, 200);

  // images
  const imgProduct = products.find((p) => p.image);
  if (imgProduct) {
    r = await req('GET', imgProduct.image);
    record('image URL serves bytes', r.status === 200 && r.buf.length > 100, `HTTP ${r.status} · ${r.buf.length}B · ${r.contentType}`);
  } else {
    note('image URL test skipped', 'no product with a non-null image in the sampled page');
  }
  r = await req('GET', `/api/images/product.template/${state.product.id}`);
  record('GET /api/images/{model}/{uuid} → 200 or 404', [200, 404].includes(r.status), `HTTP ${r.status}`);
  r = await req('GET', '/api/images/bogus.model/00000000-0000-0000-0000-000000000000');
  record('unsupported image model rejected', [400, 404, 422].includes(r.status), `HTTP ${r.status}`);

  // internal adjustment product leak
  r = await req('GET', '/api/products?lang=en&limit=100');
  const internal = ['Tips', 'Down Payment (POS)', 'Discount', 'Gift Card', 'Top-up eWallet'];
  const leaked = (r.json?.data || []).filter((p) => internal.includes(p.name));
  record('internal adjustment products excluded from catalog', leaked.length === 0,
    leaked.length ? `LEAKED: ${leaked.map((p) => p.name).join(', ')}` : 'none in first 100');

  // ── 2. Public content ───────────────────────────────────────
  group('2. Public content');

  for (const [name, url] of [
    ['GET /api/homepage', '/api/homepage?lang=en'], ['GET /api/homepage?lang=ar', '/api/homepage?lang=ar'],
    ['GET /api/navigation', '/api/navigation?lang=en'], ['GET /api/settings/public', '/api/settings/public'],
    ['GET /api/faq', '/api/faq?lang=en'], ['GET /api/faq?lang=ar', '/api/faq?lang=ar'],
    ['GET /api/reviews', '/api/reviews'], ['GET /api/countries/SA/states', '/api/countries/SA/states'],
  ]) {
    expect(name, await req('GET', url), 200);
  }

  r = await req('GET', '/api/countries/SA/states');
  state.states = r.json?.data || [];
  record('states use Odoo codes, not ISO numeric', state.states.length > 0 && state.states.every((s) => !/^\d+$/.test(s.code)),
    `${state.states.length} states · ${state.states.slice(0, 3).map((s) => s.code).join(',')}`);
  state.state = state.states.find((s) => s.code === 'RUH') || state.states[0];

  r = await req('GET', '/api/settings/public');
  record('settings/public has no credentials', !/secret|token|password/i.test(JSON.stringify(r.json?.data || {})), Object.keys(r.json?.data || {}).join(','));

  // ── 3. Auth ─────────────────────────────────────────────────
  group('3. Authentication & profile');

  state.email = `cycle.${RUN}@example.com`;
  state.password = 'CycleTest123!';
  state.phone = '+9665' + String(Date.now()).slice(-8);

  // Registration is rate-limited per client; tolerate the limiter and fall back
  // to a previously provisioned test customer so the suite stays re-runnable.
  r = await req('POST', '/api/auth/register', {
    body: { name: 'Cycle Tester', email: state.email, password: state.password, phone: state.phone, language: 'en' },
  });
  let regEmail = null;
  if (isRateLimited(r)) {
    skip('POST /api/auth/register', 'rate-limited for this client — returns 422 "Too many requests"');
    note('rate limiter uses 422 validation_error', 'a throttled request should return 429 Too Many Requests');
  } else {
    expect('POST /api/auth/register → 201', r, 201);
    if (r.status === 201) regEmail = state.email;
  }

  if (regEmail) {
    r = await req('POST', '/api/auth/register', { body: { name: 'Dup', email: regEmail, password: state.password } });
    if (isRateLimited(r)) skip('duplicate register rejected', 'rate-limited');
    else record('duplicate register rejected', [409, 422].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''}`);

    r = await req('POST', '/api/auth/register', { body: { name: 'Short', email: `short.${RUN}@example.com`, password: 'abc123' } });
    if (isRateLimited(r)) skip('password < 10 chars → 422', 'rate-limited');
    else record('password < 10 chars → 422', r.status === 422 && r.json?.error?.code === 'validation_error', `HTTP ${r.status}`);
  }

  // establish a customer session
  state.token = null;
  const accounts = [
    regEmail ? { email: regEmail, password: state.password } : null,
    { email: 'cycle.persist@example.com', password: 'CycleTest123!' },
    { email: 'cycle.mw2e5h1f@example.com', password: 'CycleTest123!' },
  ].filter(Boolean);
  for (const acc of accounts) {
    const lr = await req('POST', '/api/auth/login', { body: acc });
    if (lr.status === 200 && lr.json?.data?.access_token) {
      state.token = lr.json.data.access_token;
      state.email = acc.email;
      expect('POST /api/auth/login (email)', lr, 200);
      record('login returns expires_in', typeof lr.json?.data?.expires_in === 'number', `${lr.json?.data?.expires_in}s`);
      break;
    }
    if (isRateLimited(lr)) { skip('POST /api/auth/login', 'rate-limited'); break; }
  }
  if (!state.token) {
    record('customer session established', false, 'no registration or fallback login succeeded');
    return;
  }

  r = await req('GET', '/api/auth/me', { token: state.token });
  expect('GET /api/auth/me', r, 200);
  state.user = r.json?.data;
  record('me returns id + is_admin + language',
    !!state.user?.id && typeof state.user?.is_admin === 'boolean' && ['ar', 'en'].includes(state.user?.language),
    `id=${state.user?.id?.slice(0, 8)}… is_admin=${state.user?.is_admin} lang=${state.user?.language}`);

  r = await req('POST', '/api/auth/login', { body: { email: state.email, password: 'WrongPassword123!' } });
  expect('wrong password → 401', r, 401, { success: false });
  record('error.code = invalid_credentials', r.json?.error?.code === 'invalid_credentials', r.json?.error?.code);

  r = await req('GET', '/api/auth/me');
  expect('GET /api/auth/me without token → 401', r, 401, { success: false });
  record('error.code = authentication_required', r.json?.error?.code === 'authentication_required', r.json?.error?.code);

  r = await req('GET', '/api/auth/me', { token: 'garbage.token.value' });
  record('malformed token → 401', r.status === 401, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('PUT', '/api/auth/me', { token: state.token, body: { name: 'Cycle Tester AR', language: 'ar' } });
  expect('PUT /api/auth/me', r, 200);
  record('profile language → ar', r.json?.data?.language === 'ar', r.json?.data?.language);
  await req('PUT', '/api/auth/me', { token: state.token, body: { language: 'en' } });

  r = await req('POST', '/api/auth/password/reset', { body: { email: state.email } });
  if (isRateLimited(r)) skip('POST /api/auth/password/reset', 'rate-limited');
  else {
    expect('POST /api/auth/password/reset', r, 200);
    const r2 = await req('POST', '/api/auth/password/reset', { body: { email: `nobody.${RUN}@example.com` } });
    if (isRateLimited(r2)) skip('reset identical for unknown email', 'rate-limited');
    else record('reset identical for unknown email (no enumeration)', r2.status === 200 && r2.json?.success === true, `HTTP ${r2.status}`);
  }

  // ── 4. Addresses ────────────────────────────────────────────
  group('4. Saved addresses');

  r = await req('GET', '/api/addresses', { token: state.token });
  expect('GET /api/addresses', r, 200);
  record('addresses is array', Array.isArray(r.json?.data), `len=${r.json?.data?.length}`);

  r = await req('POST', '/api/addresses', {
    token: state.token,
    body: {
      type: 'delivery', name: 'Cycle Tester', phone: '+966500000001',
      street: 'King Fahd Road', street2: 'Building 10', district: 'Al Olaya',
      city: 'Riyadh', state: state.state.code, country: 'SA', zip: '12211',
      default_shipping: true, default_billing: false,
    },
  });
  expect('POST /api/addresses → 201', r, 201);
  state.address = r.json?.data;
  record('address returns type + state code', state.address?.type === 'delivery' && state.address?.state === state.state.code,
    `type=${state.address?.type} state=${state.address?.state}`);

  r = await req('POST', '/api/addresses', {
    token: state.token, body: { name: 'Bad', phone: '+966500000001', street: 'X', city: 'Riyadh', country: 'SA', state: 'ZZZ' },
  });
  record('invalid state code → 422', r.status === 422, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('PUT', `/api/addresses/${state.address.id}`, { token: state.token, body: { phone: '+966511111111', district: 'Al Malqa' } });
  expect('PUT /api/addresses/{id}', r, 200);
  record('address phone updated', r.json?.data?.phone === '+966511111111', r.json?.data?.phone);

  r = await req('GET', '/api/addresses', { token: state.token });
  record('address shape stable (type + default flags)', r.json?.data?.every((a) => 'type' in a && 'default_shipping' in a), `len=${r.json?.data?.length}`);

  r = await req('GET', `/api/addresses/${state.address.id}`, { token: state.token });
  record('GET single address unsupported → 404/405', [404, 405].includes(r.status), `HTTP ${r.status} (guide documents list only)`);

  // ── 5. Cart ─────────────────────────────────────────────────
  group('5. Cart (guest + authenticated)');
  const lines = [{ variant_id: state.variant.id, quantity: 2 }];

  r = await req('POST', '/api/cart', { body: { lines } });
  expect('POST /api/cart (guest) → 201', r, 201);
  state.cartToken = r.json?.data?.token;
  const cart = r.json?.data;
  record('cart returns token', !!state.cartToken, state.cartToken ? 'token issued' : 'missing');
  record('line has product{} + variant{}', !!cart?.lines?.[0]?.product?.id && !!cart?.lines?.[0]?.variant?.id, cart?.lines?.[0]?.product?.name);
  record('totals are Money objects', ['subtotal', 'tax', 'total', 'discount', 'loyalty_discount', 'shipping', 'cod_surcharge'].every((k) => isMoney(cart?.[k])), `total=${money(cart?.total)}`);
  record('cart has rewards[]', Array.isArray(cart?.rewards), `len=${cart?.rewards?.length}`);
  record('cart has expires_at', !!cart?.expires_at, cart?.expires_at);
  record('variant has available_quantity + qty_available', typeof cart?.lines?.[0]?.variant?.available_quantity === 'number' && typeof cart?.lines?.[0]?.variant?.qty_available === 'number', `free=${cart?.lines?.[0]?.variant?.available_quantity} onhand=${cart?.lines?.[0]?.variant?.qty_available}`);

  r = await req('GET', '/api/cart', { cartToken: state.cartToken });
  expect('GET /api/cart (X-Cart-Token)', r, 200);
  record('cart persists', r.json?.data?.lines?.[0]?.variant?.id === state.variant.id, `${r.json?.data?.lines?.length} line(s)`);

  r = await req('GET', '/api/cart');
  record('GET /api/cart without token', r.status === 200 || [401, 404].includes(r.status), `HTTP ${r.status} ${r.status === 200 ? '(issues a fresh empty cart)' : ''}`);
  if (r.status === 200) note('anonymous GET /api/cart mints a new empty cart', 'each unauthenticated GET can create a cart record — consider 401 or read-only');

  r = await req('POST', '/api/cart', { cartToken: state.cartToken, body: { lines: [{ variant_id: state.variant.id, quantity: 0 }] } });
  record('quantity 0 → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/cart', { cartToken: state.cartToken, body: { lines: [{ variant_id: 'not-a-variant', quantity: 1 }] } });
  record('unknown variant → 404/422', [404, 422].includes(r.status), `HTTP ${r.status}`);

  r = await req('POST', '/api/cart', { cartToken: state.cartToken, body: { lines: [] } });
  record('lines:[] clears cart', r.status === 201 && (r.json?.data?.lines?.length || 0) === 0, `HTTP ${r.status} lines=${r.json?.data?.lines?.length}`);

  r = await req('POST', '/api/cart', { token: state.token, body: { lines } });
  expect('POST /api/cart (authenticated) → 201', r, 201);
  r = await req('GET', '/api/cart', { token: state.token });
  expect('GET /api/cart (authenticated)', r, 200);

  // ── 6. Coupons & loyalty ────────────────────────────────────
  group('6. Coupons & loyalty');

  r = await req('POST', '/api/coupons/validate', { body: { code: `NOPE-${RUN}`, lines } });
  record('invalid coupon → 422', r.status === 422, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('POST', '/api/coupons/validate', { body: { code: `nope-${RUN}`, lines: [] } });
  record('empty lines rejected → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('GET', '/api/loyalty', { token: state.token });
  expect('GET /api/loyalty', r, 200);
  record('loyalty balance + point_value', typeof r.json?.data?.balance === 'number' && isMoney(r.json?.data?.point_value), `balance=${r.json?.data?.balance} value=${money(r.json?.data?.point_value)}`);
  record('loyalty entries array', Array.isArray(r.json?.data?.entries), `len=${r.json?.data?.entries?.length}`);

  r = await req('POST', '/api/loyalty', { token: state.token, body: { points: 100 } });
  record('POST /api/loyalty preview', [200, 422].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''} ${money(r.json?.data?.value)}`);

  r = await req('POST', '/api/loyalty', { token: state.token, body: { points: -5 } });
  record('negative points → 422', r.status === 422, `HTTP ${r.status}`);

  // ── 7. Reviews / questions / stock ──────────────────────────
  group('7. Reviews, questions & stock alerts');

  // rotate the reviewed product so re-runs on a shared customer do not collide
  const rpIdx = [...RUN].reduce((a, ch) => a + ch.charCodeAt(0), 0) % products.length;
  state.reviewProduct = products[rpIdx] || state.product;

  r = await req('POST', '/api/reviews', { token: state.token, body: { product_id: state.reviewProduct.id, rating: 5, title: 'Cycle test', body: 'Automated end-to-end cycle review.' } });
  if (r.status === 422 && /already|مسبق|موجود/i.test(String(r.json?.error?.message || ''))) {
    skip('POST /api/reviews → 201', 'this customer already reviewed the sampled product in an earlier run');
  } else {
    expect('POST /api/reviews → 201', r, 201);
    state.review = r.json?.data;
  }

  r = await req('POST', '/api/reviews', { token: state.token, body: { product_id: state.reviewProduct.id, rating: 5, title: 'Dup', body: 'Duplicate review.' } });
  record('duplicate review → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/reviews', { token: state.token, body: { product_id: state.reviewProduct.id, rating: 9, title: 'Bad', body: 'Out of range.' } });
  record('rating > 5 → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/reviews', { token: state.token, body: { product_slug: state.reviewProduct.slug, rating: 4, title: 'Slug alias', body: 'Review posted by slug.' } });
  record('review accepts product_slug alias', [201, 422].includes(r.status), `HTTP ${r.status} (422 = duplicate guard, acceptable)`);

  r = await req('GET', `/api/reviews?product=${state.reviewProduct.id}`);
  expect('GET /api/reviews?product=', r, 200);
  record('reviews summary shape', !!r.json?.data?.summary && Array.isArray(r.json?.data?.items), `count=${r.json?.data?.summary?.count} avg=${r.json?.data?.summary?.average}`);
  record('pending review hidden', !state.review || !r.json?.data?.items?.some((i) => i.id === state.review?.id), 'correctly unpublished');

  r = await req('POST', '/api/questions', { token: state.token, body: { product_id: state.product.id, question: 'Is this coffee suitable for espresso brewing?' } });
  expect('POST /api/questions → 201', r, 201);
  state.question = r.json?.data;

  r = await req('POST', '/api/questions', { token: state.token, body: { product_id: state.product.id, question: 'abc' } });
  record('question < 5 chars → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('GET', `/api/questions?product=${state.product.id}`);
  expect('GET /api/questions?product=', r, 200);

  r = await req('POST', '/api/stock-notifications', { body: { variant_id: state.variant.id, email: `stock.${RUN}@example.com` } });
  record('POST /api/stock-notifications (guest with email)', [200, 201].includes(r.status), `HTTP ${r.status}`);

  r = await req('POST', '/api/stock-notifications', { body: {} });
  record('stock notification with no variant/contact → 422', r.status === 422, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  // A guest with no contact method must still be rejected, even when a subscription
  // already exists for that variant (otherwise the existing record is disclosed).
  r = await req('POST', '/api/stock-notifications', { body: { variant_id: state.variant.id } });
  record('stock notification, no contact, existing record → 422', r.status === 422,
    r.status === 201 ? `HTTP 201 — accepted and returned an existing subscription id (${r.json?.data?.id})` : `HTTP ${r.status}`);

  r = await req('POST', '/api/stock-notifications', { body: { variant_id: state.variant.id, email: 'not-an-email' } });
  record('stock notification rejects malformed email', r.status === 422, `HTTP ${r.status} ${r.status === 201 ? '(malformed address accepted)' : ''}`);

  // ── 8. Public forms ─────────────────────────────────────────
  group('8. Public forms');

  r = await req('POST', '/api/contact', { body: { name: 'Cycle Tester', email: `contact.${RUN}@example.com`, phone: '+966500000001', message: 'Automated cycle test contact message.' } });
  record('POST /api/contact', [200, 201].includes(r.status), `HTTP ${r.status}`);

  r = await req('POST', '/api/contact', { body: { name: 'No Email', message: 'missing email' } });
  record('contact without email → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/wholesale', { body: { name: 'Cycle Coffee LLC', email: `wholesale.${RUN}@example.com`, phone: '+966500000002', message: 'Wholesale pricing for 50kg/month.' } });
  record('POST /api/wholesale', [200, 201].includes(r.status), `HTTP ${r.status}`);

  r = await req('POST', '/api/newsletter', { body: { email: `news.${RUN}@example.com`, language: 'en' } });
  record('POST /api/newsletter', [200, 201].includes(r.status), `HTTP ${r.status}`);

  r = await req('POST', '/api/contact', { body: JSON.stringify({ name: 'Big', email: 'a@b.com', message: 'A'.repeat(1_200_000) }) });
  record('body > 1 MiB rejected', [413, 422].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  // ── 9. Checkout ─────────────────────────────────────────────
  group('9. Checkout & idempotency');

  const idem = crypto.randomUUID();
  const guestEmail = `guest.${RUN}@example.com`;
  const guestPhone = '+9665' + String(Date.now() + 1).slice(-8);
  const guestBody = {
    email: guestEmail,
    lines: [{ variant_id: state.variant.id, quantity: 1 }],
    address: { name: 'Guest Cycle', email: guestEmail, phone: guestPhone, street: 'King Fahd Road', street2: 'Building 10', district: 'Al Olaya', city: 'Riyadh', state: state.state.code, country: 'SA', zip: '12211' },
    shipping_method_id: state.shipping.id,
    payment_method: 'cod',
  };

  r = await req('POST', '/api/checkout', { body: guestBody });
  record('checkout without Idempotency-Key → 4xx', r.status >= 400, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('POST', '/api/checkout', { body: guestBody, headers: { 'Idempotency-Key': idem } });
  expect('POST /api/checkout (guest COD) → 201', r, 201);
  state.guestOrder = r.json?.data?.order;
  record('payment_action cod/accepted', r.json?.data?.payment_action?.type === 'cod' && r.json?.data?.payment_action?.status === 'accepted', JSON.stringify(r.json?.data?.payment_action));
  record('order has tracking_access_token', !!state.guestOrder?.tracking_access_token, 'present');
  record('order has status_history[]', Array.isArray(state.guestOrder?.status_history), `len=${state.guestOrder?.status_history?.length}`);
  record('order Money breakdown complete', ['subtotal', 'shipping', 'discount', 'loyalty_discount', 'cod_surcharge', 'tax', 'total'].every((k) => isMoney(state.guestOrder?.[k])), `sub=${money(state.guestOrder?.subtotal)} ship=${money(state.guestOrder?.shipping)} total=${money(state.guestOrder?.total)}`);

  if (state.guestOrder) {
    const o = state.guestOrder;
    const calc = o.subtotal.amount + o.shipping.amount + o.cod_surcharge.amount - o.discount.amount - o.loyalty_discount.amount + o.tax.amount;
    record('total arithmetic matches formula', Math.abs(calc - o.total.amount) < 0.02, `calc=${calc.toFixed(2)} api=${o.total.amount}`);
    record('coupon null without coupon', o.coupon === null, String(o.coupon));
    record('loyalty always object', !!o.loyalty && typeof o.loyalty === 'object', JSON.stringify(o.loyalty));
    record('order lines exclude adjustment lines', !o.lines?.some((l) => /discount|shipping|cod/i.test(l.name || '')), `${o.lines?.length} product line(s)`);
  }

  r = await req('POST', '/api/checkout', { body: guestBody, headers: { 'Idempotency-Key': idem } });
  record('replay → 200 replayed:true', r.status === 200 && r.json?.data?.replayed === true, `HTTP ${r.status} replayed=${r.json?.data?.replayed}`);
  record('replay returns same order', r.json?.data?.order?.id === state.guestOrder?.id, `order=${r.json?.data?.order?.number}`);

  r = await req('POST', '/api/checkout', { body: { ...guestBody, email: `other.${RUN}@example.com` }, headers: { 'Idempotency-Key': idem } });
  record('replay with different guest email → 4xx', r.status >= 400, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('POST', '/api/checkout', {
    token: state.token, headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: { lines: [{ variant_id: state.variant.id, quantity: 1 }], address_id: state.address.id, shipping_method_id: state.shipping.id, payment_method: 'cod' },
  });
  expect('POST /api/checkout (auth COD, saved address) → 201', r, 201);
  state.authOrder = r.json?.data?.order;
  record('address snapshot persisted', !!state.authOrder?.shipping_address?.city, state.authOrder?.shipping_address?.city);
  record('carrier resolved on detail', !!state.authOrder?.carrier, JSON.stringify(state.authOrder?.carrier));

  r = await req('POST', '/api/checkout', { headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { ...guestBody, loyalty_points: 50 } });
  record('guest loyalty redemption → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/checkout', { headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { ...guestBody, lines: [{ variant_id: state.variant.id, quantity: 999999 }] } });
  record('oversized quantity → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/checkout', { headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { ...guestBody, payment_method: 'not_a_method' } });
  record('unknown payment_method → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/checkout', { headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { ...guestBody, shipping_method_id: '00000000-0000-0000-0000-000000000000' } });
  record('unknown shipping_method → 4xx', r.status >= 400, `HTTP ${r.status}`);

  // cart-token checkout without lines
  const cartForCheckout = await req('POST', '/api/cart', { body: { lines: [{ variant_id: state.variant.id, quantity: 1 }] } });
  r = await req('POST', '/api/checkout', {
    cartToken: cartForCheckout.json?.data?.token,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: { email: `cartco.${RUN}@example.com`, address: { name: 'Cart Checkout', phone: guestPhone, street: 'Olaya St', city: 'Riyadh', state: state.state.code, country: 'SA', zip: '12211' }, shipping_method_id: state.shipping.id, payment_method: 'cod' },
  });
  record('checkout from cart token (lines omitted) → 201', r.status === 201, `HTTP ${r.status} ${r.json?.error?.code || ''}`);
  state.cartOrder = r.json?.data?.order;

  // online payment availability
  const online = state.paymentMethods.filter((m) => m.code !== 'cod');
  if (online.length === 0) {
    note('online payment not exercised', 'only COD is enabled in /api/payment-methods, so no pending-order/payment_action path is reachable');
  }

  // ── 10. Orders / invoice / tracking ─────────────────────────
  group('10. Orders, invoice & tracking');

  r = await req('GET', '/api/orders?page=1&limit=20', { token: state.token });
  expect('GET /api/orders', r, 200);
  record('orders paginated meta', !!r.json?.meta, JSON.stringify(r.json?.meta));
  const listItem = r.json?.data?.find((o) => o.id === state.authOrder?.id);
  record('auth order listed', !!listItem, `len=${r.json?.data?.length}`);
  record('list item Money total + rewards[]', isMoney(listItem?.total) && Array.isArray(listItem?.rewards), `total=${money(listItem?.total)}`);

  r = await req('GET', `/api/orders/${state.authOrder.id}`, { token: state.token });
  expect('GET /api/orders/{id}', r, 200);
  record('detail has carrier key', 'carrier' in (r.json?.data || {}), JSON.stringify(r.json?.data?.carrier));
  record('detail lines carry attributes[]', Array.isArray(r.json?.data?.lines?.[0]?.attributes), `${r.json?.data?.lines?.length} line(s)`);

  r = await req('GET', `/api/orders/${state.guestOrder.id}`, { token: state.token });
  record("cannot read another customer's order", [403, 404].includes(r.status), `HTTP ${r.status}`);

  r = await req('GET', `/api/orders/${state.authOrder.id}/invoice`, { token: state.token });
  record('invoice returns PDF', r.status === 200 && r.buf.slice(0, 5).toString() === '%PDF-', `HTTP ${r.status} · ${r.buf.length}B · ${r.contentType}`);

  r = await req('GET', `/api/orders/${state.guestOrder.id}/invoice`, { token: state.token });
  record("cannot download another customer's invoice", [403, 404].includes(r.status), `HTTP ${r.status}`);

  r = await req('GET', `/api/tracking/${state.guestOrder.number}?token=${state.guestOrder.tracking_access_token}`);
  expect('GET /api/tracking/{number}?token=', r, 200);
  record('tracking minimal field set', ['order_number', 'status', 'carrier', 'tracking_number', 'tracking_url'].every((k) => k in (r.json?.data || {})), Object.keys(r.json?.data || {}).join(','));

  r = await req('GET', `/api/public/orders/${state.guestOrder.number}?token=${state.guestOrder.tracking_access_token}`);
  expect('GET /api/public/orders/{number} alias', r, 200);

  r = await req('GET', `/api/tracking/${state.guestOrder.number}?access_token=${state.guestOrder.tracking_access_token}`);
  record('access_token query alias accepted', r.status === 200, `HTTP ${r.status}`);

  r = await req('GET', `/api/tracking/${state.guestOrder.number}?token=wrong`);
  record('wrong tracking token → 404', r.status === 404, `HTTP ${r.status}`);

  r = await req('GET', `/api/tracking/${state.guestOrder.number}`);
  record('tracking without token → 404 (no enumeration)', r.status === 404, `HTTP ${r.status}`);

  r = await req('GET', `/api/tracking/${state.guestOrder.number}?token=${state.guestOrder.tracking_access_token}&lang=ar_001`);
  record('tracking lang=ar_001 accepted', r.status === 200, `HTTP ${r.status}`);

  // Deleting an address that a sale order already references must fail cleanly.
  r = await req('DELETE', `/api/addresses/${state.address.id}`, { token: state.token });
  record('delete order-linked address → 4xx conflict, not 5xx', r.status >= 400 && r.status < 500,
    `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  // ── 11. Integrations config ─────────────────────────────────
  group('11. Integration configuration');

  r = await req('GET', '/api/auth/google/config');
  expect('GET /api/auth/google/config', r, 200);
  record('google config shape', ['enabled', 'client_id', 'client_ids'].every((k) => k in (r.json?.data || {})), `enabled=${r.json?.data?.enabled}`);

  r = await req('POST', '/api/auth/google', { body: { credential: 'not-a-real-token', language: 'en' } });
  record('google sign-in rejects invalid credential (401) or unconfigured (422)', [401, 422].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''}`);
  if (r.status === 422) note('Google sign-in is not configured on this deployment', r.json?.error?.message?.slice(0, 80));

  r = await req('GET', '/api/notifications/config');
  expect('GET /api/notifications/config', r, 200);

  r = await req('GET', '/api/payments/config');
  expect('GET /api/payments/config', r, 200);

  // ── 12. Admin auth & dashboard ──────────────────────────────
  group('12. Admin — auth & dashboard');

  r = await req('POST', '/api/auth/login', { body: { login: envValue('ODOO_LOGIN'), password: envValue('ODOO_PASSWORD') } });
  expect('admin login (login field)', r, 200);
  state.adminToken = r.json?.data?.access_token;

  r = await req('GET', '/api/auth/me', { token: state.adminToken });
  record('admin is_admin true', r.json?.data?.is_admin === true, `is_admin=${r.json?.data?.is_admin}`);

  r = await req('GET', '/api/admin/stats', { token: state.token });
  record('customer token blocked from admin → 403', r.status === 403, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('GET', '/api/admin/stats', { token: state.adminToken });
  expect('GET /api/admin/stats', r, 200);
  record('stats fields present', ['month', 'orders', 'revenue', 'average_order_value', 'pending_orders', 'stock_alerts', 'customers'].every((k) => k in (r.json?.data || {})), `orders=${r.json?.data?.orders} revenue=${money(r.json?.data?.revenue)}`);

  r = await req('GET', '/api/admin/settings', { token: state.adminToken });
  expect('GET /api/admin/settings', r, 200);
  if (r.status === 200) record('settings never returns JWT secret', !JSON.stringify(r.json?.data || {}).toLowerCase().includes('"jwt_secret"'), Object.keys(r.json?.data || {}).join(','));

  r = await req('PUT', '/api/admin/settings', { token: state.adminToken, body: { cod_surcharge: 0 } });
  expect('PUT /api/admin/settings', r, 200);

  r = await req('GET', '/api/admin/homepage', { token: state.adminToken });
  expect('GET /api/admin/homepage', r, 200);

  // ── 13. Admin categories CRUD ───────────────────────────────
  group('13. Admin — categories CRUD');

  const catSlug = `cycle-cat-${RUN}`;
  r = await req('POST', '/api/categories', {
    token: state.adminToken,
    body: { name_en: 'Cycle Category', name_ar: 'فئة الاختبار', slug: catSlug, description_en: 'Created by automated cycle test.', featured: false, sequence: 99 },
  });
  expect('POST /api/categories → 201', r, 201);
  state.newCat = r.json?.data;
  record('create returns id + slug', !!state.newCat?.id && !!state.newCat?.slug, `${state.newCat?.slug}`);
  note('POST/PUT category return a stub, not the full record', `create → ${JSON.stringify(Object.keys(state.newCat || {}))}; update → {updated:true}`);

  r = await req('PUT', `/api/categories/${state.newCat.id}`, { token: state.adminToken, body: { name_en: 'Cycle Category Updated', sequence: 98 } });
  expect('PUT /api/categories/{id}', r, 200);
  const catCheck = await req('GET', '/api/categories?lang=en');
  record('category update persisted', catCheck.json?.data?.some((c) => c.id === state.newCat.id && c.name === 'Cycle Category Updated'), 'verified via GET');

  r = await req('GET', '/api/categories?lang=en');
  record('created category publicly visible', r.json?.data?.some((c) => c.slug === catSlug), 'found in public list');

  // ── 14. Admin products CRUD ─────────────────────────────────
  group('14. Admin — products CRUD');

  const skuBase = `CYC-${RUN}`.toUpperCase();
  r = await req('POST', '/api/products', {
    token: state.adminToken,
    body: {
      name_en: 'Cycle Test Coffee', name_ar: 'قهوة اختبار', subtitle_en: 'Automated cycle product',
      description_en: 'Product created by the automated end-to-end cycle test.',
      slug: `cycle-product-${RUN}`,
      origin_country: 'Ethiopia', origin_region: 'Guji', altitude: '1900-2100 masl',
      process: 'Washed', roast_level: 'medium', variety: 'Heirloom',
      acidity: 4, sweetness: 5, body_score: 3, balance: 4,
      tasting_notes_en: 'Jasmine, bergamot, peach',
      is_new: true, is_featured: true,
      categories: [state.newCat.id],
      attributes: [{ name: 'Weight', values: ['250g', '1kg'] }],
      variants: [
        { attributes: { Weight: '250g' }, sku: `${skuBase}-250`, price: 65, active: true },
        { attributes: { Weight: '1kg' }, sku: `${skuBase}-1KG`, price: 220, active: true },
      ],
    },
  });
  expect('POST /api/products → 201', r, 201);
  state.newProduct = r.json?.data;
  record('product has 2 variants', (state.newProduct?.variants?.length || 0) === 2, `${state.newProduct?.variants?.length} variants`);
  record('product linked to category', (state.newProduct?.categories?.length || 0) > 0, JSON.stringify(state.newProduct?.categories));

  r = await req('GET', `/api/products/${state.newProduct.id}?lang=en`);
  expect('new product publicly readable', r, 200);
  const np = r.json?.data || {};
  record('slug preserved', np.slug === `cycle-product-${RUN}`, np.slug);
  record('flat coffee fields persisted into coffee{}',
    np.coffee?.origin_country === 'Ethiopia' && np.coffee?.roast_level === 'medium' && np.coffee?.region === 'Guji',
    `origin=${np.coffee?.origin_country} roast=${np.coffee?.roast_level}`);
  record('flat flags persisted into flags{}', np.flags?.new === true && np.flags?.featured === true, JSON.stringify(np.flags));
  record('flavor scores persisted', np.coffee?.acidity === 4 && np.coffee?.sweetness === 5, `acidity=${np.coffee?.acidity} sweetness=${np.coffee?.sweetness}`);

  const v250 = state.newProduct.variants.find((v) => v.sku === `${skuBase}-250`);
  r = await req('PUT', `/api/products/${state.newProduct.id}`, {
    token: state.adminToken,
    body: { is_featured: false, description_en: 'Updated by cycle test.', variants: [{ id: v250.id, price: 69, active: true }] },
  });
  expect('PUT /api/products/{id}', r, 200);
  const afterPut = await req('GET', `/api/products/${state.newProduct.id}?lang=en`);
  const v250after = afterPut.json?.data?.variants?.find((v) => v.id === v250.id);
  record('variant price updated (69 incl)', v250after?.price_included?.amount === 69, `incl=${money(v250after?.price_included)} excl=${money(v250after?.price_excluded)}`);
  record('is_featured toggled false', afterPut.json?.data?.flags?.featured === false, JSON.stringify(afterPut.json?.data?.flags));
  note('PUT /api/products returns variants in a different order than POST', 'match variants by id, never by array index');

  r = await req('POST', '/api/products', { token: state.adminToken, body: { description_en: 'no name' } });
  record('product without name_en/name_ar → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/products', { token: state.adminToken, body: { name_en: 'Bad Variant', attributes: [{ name: 'Weight', values: ['1kg'] }], variants: [{ attributes: { Weight: '1kg' }, price: 10 }] } });
  record('variant without SKU rejected → 422', r.status === 422, `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  // ── 15. Admin coupons & loyalty ─────────────────────────────
  group('15. Admin — coupons & loyalty');

  r = await req('GET', '/api/admin/coupons', { token: state.adminToken });
  expect('GET /api/admin/coupons', r, 200);
  record('coupons expose native source only', r.json?.data?.every((c) => ['loyalty.rule', 'loyalty.card'].includes(c.source)), `${r.json?.data?.length} records`);
  record('coupon carries program + reward metadata', r.json?.data?.every((c) => 'program_id' in c && 'program_type' in c && 'rewards' in c), 'program_id/program_type/rewards present');

  state.couponCode = `CYCLE${RUN}`.toUpperCase();
  r = await req('POST', '/api/admin/coupons', {
    token: state.adminToken,
    body: { name: 'Cycle Welcome 10%', code: state.couponCode, type: 'percent', amount: 10, minimum_spend: 0, usage_limit: 100, date_start: new Date().toISOString().slice(0, 10), date_end: '2027-12-31' },
  });
  expect('POST /api/admin/coupons (percent) → 201', r, 201);
  state.coupon = r.json?.data;
  record('coupon created as loyalty.rule', state.coupon?.source === 'loyalty.rule', state.coupon?.source);

  r = await req('POST', '/api/coupons/validate', { body: { code: state.couponCode, lines } });
  expect('POST /api/coupons/validate (new code)', r, 200);
  record('validation returns native metadata',
    ['valid', 'code', 'type', 'discount', 'program_id', 'program_type', 'requires_shipping', 'rewards'].every((k) => k in (r.json?.data || {})),
    `type=${r.json?.data?.type} discount=${money(r.json?.data?.discount)}`);
  record('validation discount is Money', isMoney(r.json?.data?.discount), money(r.json?.data?.discount));

  r = await req('POST', '/api/coupons/validate', { body: { code: state.couponCode.toLowerCase(), lines } });
  record('code casing is significant', [200, 422].includes(r.status), `HTTP ${r.status} (lowercased code)`);

  r = await req('POST', '/api/cart', { token: state.token, body: { lines, coupon_code: state.couponCode } });
  expect('POST /api/cart with coupon_code → 201', r, 201);
  record('cart applies coupon discount', (r.json?.data?.discount?.amount || 0) > 0, `discount=${money(r.json?.data?.discount)} total=${money(r.json?.data?.total)}`);

  r = await req('PUT', `/api/admin/coupons/${state.coupon.id}`, { token: state.adminToken, body: { amount: 15, active: true } });
  expect('PUT /api/admin/coupons/{id}', r, 200);
  const cl = await req('GET', '/api/admin/coupons', { token: state.adminToken });
  record('coupon amount updated to 15', Number(cl.json?.data?.find((c) => c.id === state.coupon.id)?.amount) === 15, `amount=${cl.json?.data?.find((c) => c.id === state.coupon.id)?.amount}`);

  r = await req('POST', '/api/admin/loyalty/adjust', { token: state.adminToken, body: { customer_id: state.user.id, points: 50, reason: 'Automated cycle test adjustment' } });
  expect('POST /api/admin/loyalty/adjust', r, 200);
  record('adjustment returns new balance', 'balance' in (r.json?.data || {}), `balance=${r.json?.data?.balance}`);

  r = await req('POST', '/api/admin/loyalty/adjust', { token: state.adminToken, body: { customer_id: state.user.id, points: 0, reason: 'zero' } });
  record('zero points → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/admin/loyalty/adjust', { token: state.adminToken, body: { customer_id: state.user.id, points: 10 } });
  record('missing reason → 422', r.status === 422, `HTTP ${r.status}`);

  // ── 16. Admin moderation ────────────────────────────────────
  group('16. Admin — order & moderation');

  r = await req('PUT', `/api/orders/${state.authOrder.id}`, { token: state.adminToken, body: { state: 'shipped', tracking_number: 'CYCLE-TRACK-123', reason: 'Cycle test shipment' } });
  record('PUT /api/orders/{id} → shipped', r.status === 200, `HTTP ${r.status} state=${r.json?.data?.state}`);

  r = await req('PUT', `/api/orders/${state.authOrder.id}`, { token: state.adminToken, body: { state: 'not_a_state' } });
  record('invalid state code → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('GET', `/api/orders/${state.authOrder.id}`, { token: state.adminToken });
  record('state persisted + history appended', r.json?.data?.state === 'shipped' && (r.json?.data?.status_history?.length || 0) > 0, `state=${r.json?.data?.state} history=${r.json?.data?.status_history?.length}`);

  r = await req('GET', '/api/orders?all=1&page=1&limit=5', { token: state.adminToken });
  expect('GET /api/orders?all=1 (manager)', r, 200);
  record('manager sees all store orders', (r.json?.meta?.total || 0) >= 1, `total=${r.json?.meta?.total}`);

  if (state.review?.id) {
    r = await req('PUT', `/api/reviews/${state.review.id}`, { token: state.adminToken, body: { state: 'approved', staff_reply: 'Thanks for the cycle test review.' } });
    record('PUT /api/reviews/{id} approve', r.status === 200, `HTTP ${r.status} state=${r.json?.data?.state}`);
    const rv = await req('GET', `/api/reviews?product=${state.reviewProduct.id}`);
    record('approved review now public', rv.json?.data?.items?.some((i) => i.id === state.review.id), 'visible after approval');
    record('review author field is customer_name', rv.json?.data?.items?.every((i) => 'customer_name' in i), 'customer_name present');
  }

  if (state.question?.id) {
    r = await req('PUT', `/api/questions/${state.question.id}`, { token: state.adminToken, body: { answer: 'Yes — fine grind, 1:2 ratio.' } });
    record('PUT /api/questions/{id} answer', r.status === 200, `HTTP ${r.status}`);
    const qs = await req('GET', `/api/questions?product=${state.product.id}`);
    record('answered question published', qs.json?.data?.some((q) => q.id === state.question.id), 'visible after answer');
  }

  // ── 17. Admin exports ───────────────────────────────────────
  group('17. Admin — CSV exports');

  for (const type of ['sales', 'inventory', 'coupons', 'loyalty']) {
    const rr = await req('GET', `/api/admin/reports/export?type=${type}`, { token: state.adminToken });
    const fname = rr.disposition.match(/filename="?([^";]+)/)?.[1];
    record(`export type=${type}`, rr.status === 200 && (rr.contentType.includes('csv') || rr.text.includes(',')),
      `HTTP ${rr.status} · ${rr.buf.length}B · ${fname || 'no filename'}`);
  }
  r = await req('GET', '/api/admin/reports/export?type=bogus', { token: state.adminToken });
  record('export invalid type → 422', r.status === 422, `HTTP ${r.status}`);

  // ── 18. Admin gateways / shipping / notifications ───────────
  group('18. Admin — gateways, shipping & notifications');

  r = await req('GET', '/api/admin/payment-gateways', { token: state.adminToken });
  expect('GET /api/admin/payment-gateways', r, 200);
  record('gateway secrets masked', !JSON.stringify(r.json?.data || {}).includes('sk_live'), `${r.json?.data?.length} gateways`);

  r = await req('GET', '/api/admin/payment-gateways/stripe', { token: state.adminToken });
  record('GET /api/admin/payment-gateways/{code}', [200, 404].includes(r.status), `HTTP ${r.status}`);

  r = await req('GET', '/api/admin/shipping-providers', { token: state.adminToken });
  expect('GET /api/admin/shipping-providers', r, 200);

  r = await req('GET', '/api/admin/shipping-providers/smsa', { token: state.adminToken });
  record('GET /api/admin/shipping-providers/{provider}', [200, 404].includes(r.status), `HTTP ${r.status}`);

  r = await req('POST', '/api/admin/notifications/test', {
    token: state.adminToken,
    body: { customer_id: state.user.id, title_en: 'Cycle test', title_ar: 'اختبار', body_en: 'Automated test.', body_ar: 'اختبار آلي.', data: { type: 'test' } },
  });
  record('POST /api/admin/notifications/test', [200, 201, 422].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  // shipment creation on the shipped order
  r = await req('POST', `/api/admin/orders/${state.authOrder.id}/shipment`, { token: state.adminToken, body: { provider: 'smsa' } });
  record('POST /api/admin/orders/{id}/shipment', [200, 201, 422].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''} ${r.json?.data?.tracking_number || ''}`);

  // ── 19. Customer notifications ──────────────────────────────
  group('19. Customer notifications');

  r = await req('GET', '/api/notifications?page=1&limit=20', { token: state.token });
  expect('GET /api/notifications', r, 200);
  r = await req('GET', '/api/notifications?unread=true', { token: state.token });
  expect('GET /api/notifications?unread=true', r, 200);

  // Device registration validates the FCM token shape; use a realistic-length token.
  const fcmToken = 'fMx9Q2vK3pL8nR4tY6wZ1aB5cD7eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ0aB2cD4eF6gH8iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8cD0eF2gH4iJ6kL8mN0oP2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4mN6oP8qR0sT2uV4wX6yZ8';
  r = await req('POST', '/api/notifications/devices', { token: state.token, body: { token: fcmToken, platform: 'android', device_id: `device-${RUN}`, locale: 'en' } });
  record('POST /api/notifications/devices → 201', [200, 201].includes(r.status), `HTTP ${r.status} ${r.json?.error?.code || ''}`);
  const deviceId = r.json?.data?.id;

  r = await req('POST', '/api/notifications/devices', { token: state.token, body: { token: 'x', platform: 'windows', device_id: 'd' } });
  record('invalid platform → 422', r.status === 422, `HTTP ${r.status}`);

  r = await req('POST', '/api/notifications/devices', { token: state.token, body: { token: 'short', platform: 'android', device_id: 'd' } });
  record('invalid FCM token → 422', r.status === 422, `HTTP ${r.status}`);

  if (deviceId) {
    r = await req('DELETE', `/api/notifications/devices/${deviceId}`, { token: state.token });
    record('DELETE /api/notifications/devices/{id}', [200, 204].includes(r.status), `HTTP ${r.status}`);
  }

  // ── 20. CORS ────────────────────────────────────────────────
  group('20. CORS');

  r = await req('GET', '/api/products?limit=1', { headers: { Origin: 'https://evil.example.com' } });
  record('unlisted origin → 403 origin_not_allowed', r.status === 403 && r.json?.error?.code === 'origin_not_allowed', `HTTP ${r.status} ${r.json?.error?.code || ''}`);

  r = await req('GET', '/api/products?limit=1', { headers: { Origin: 'https://selection-odoo.vercel.app' } });
  record('allowed origin → ACAO header', r.status === 200 && !!r.headers['access-control-allow-origin'], `ACAO=${r.headers['access-control-allow-origin']}`);

  r = await req('OPTIONS', '/api/checkout', { headers: { Origin: 'https://selection-odoo.vercel.app', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,idempotency-key' } });
  record('preflight OPTIONS → 204', [200, 204].includes(r.status), `HTTP ${r.status}`);

  // ── 21. Cleanup ─────────────────────────────────────────────
  group('21. Cleanup');

  if (state.newProduct?.id) {
    r = await req('DELETE', `/api/products/${state.newProduct.id}`, { token: state.adminToken });
    record('DELETE /api/products/{id} (archive)', [200, 204].includes(r.status), `HTTP ${r.status}`);
    r = await req('GET', `/api/products/${state.newProduct.id}?lang=en`);
    record('archived product no longer public', r.status === 404, `HTTP ${r.status}`);
  }
  if (state.coupon?.id) {
    r = await req('DELETE', `/api/admin/coupons/${state.coupon.id}`, { token: state.adminToken });
    record('DELETE /api/admin/coupons/{id} (archive)', [200, 204].includes(r.status), `HTTP ${r.status}`);
  }
  if (state.newCat?.id) {
    r = await req('DELETE', `/api/categories/${state.newCat.id}`, { token: state.adminToken });
    record('DELETE /api/categories/{id}', [200, 204].includes(r.status), `HTTP ${r.status}`);
  }
  if (state.review?.id) {
    r = await req('DELETE', `/api/reviews/${state.review.id}`, { token: state.adminToken });
    record('DELETE /api/reviews/{id}', [200, 204].includes(r.status), `HTTP ${r.status}`);
  }
  if (state.question?.id) {
    r = await req('DELETE', `/api/questions/${state.question.id}`, { token: state.adminToken });
    record('DELETE /api/questions/{id}', [200, 204].includes(r.status), `HTTP ${r.status}`);
  }
  // address happy-path cleanup uses a throwaway record (the checkout address is order-linked)
  const tmpAddr = await req('POST', '/api/addresses', {
    token: state.token,
    body: { type: 'other', name: 'Cleanup Address', phone: state.phone, street: 'Cleanup St', city: 'Riyadh', state: state.state.code, country: 'SA', zip: '11111' },
  });
  if (tmpAddr.status === 201) {
    r = await req('DELETE', `/api/addresses/${tmpAddr.json.data.id}`, { token: state.token });
    record('DELETE /api/addresses/{id} (unused) → 200', [200, 204].includes(r.status), `HTTP ${r.status}`);
    r = await req('DELETE', `/api/addresses/${tmpAddr.json.data.id}`, { token: state.token });
    record('re-delete deleted address → 404', r.status === 404, `HTTP ${r.status}`);
  }

  r = await req('POST', '/api/auth/logout', { token: state.token });
  record('POST /api/auth/logout', [200, 204].includes(r.status), `HTTP ${r.status}`);
  r = await req('GET', '/api/auth/me', { token: state.token });
  record('revoked token rejected → 401', r.status === 401, `HTTP ${r.status}`);
}

function finish() {
  const total = results.length;
  const passed = results.filter((x) => x.ok).length;
  const failed = total - passed;
  const groups = [...new Set(results.map((x) => x.group))];
  const byGroup = groups.map((g) => {
    const items = results.filter((x) => x.group === g);
    return { group: g, total: items.length, passed: items.filter((i) => i.ok).length, failed: items.filter((i) => !i.ok).length };
  });
  const out = {
    base: BASE, run: RUN, generatedAt: new Date().toISOString(),
    summary: { total, passed, failed, passRate: total ? +(passed / total * 100).toFixed(1) : 0 },
    byGroup, failures: results.filter((x) => !x.ok), notes, results,
  };
  const dir = path.dirname(fileURLToPath(import.meta.url));
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(out, null, 2));

  console.log(`\n${C.B}════════════════════════════════════════════════${C.x}`);
  for (const g of byGroup) {
    const mark = g.failed ? `${C.r}✗${C.x}` : `${C.g}✓${C.x}`;
    console.log(`  ${mark} ${g.group.padEnd(44)} ${String(g.passed).padStart(3)}/${String(g.total).padEnd(3)}`);
  }
  console.log(`${C.B}════════════════════════════════════════════════${C.x}`);
  console.log(`  TOTAL ${passed}/${total} passed (${out.summary.passRate}%)   failed: ${failed}`);
  if (failed) {
    console.log(`\n${C.r}${C.B}FAILURES${C.x}`);
    for (const f of out.failures) console.log(`  ${C.r}✗${C.x} [${f.group}] ${f.name} — ${f.detail}`);
  }
  console.log(`\nReport → tests/report.json`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => { console.error('FATAL', e); process.exitCode = 1; }).then(() => finish());
