/**
 * Shared server-side logic for writing product images into Odoo.
 *
 * The REST addon exposes no image-write path (POST /api/upload is a 404 and
 * PUT /api/products/{id} silently drops image fields), so we go through Odoo's
 * own JSON-RPC and write product.template.image_1920 directly.
 *
 * Used by:
 *   - api/product-image.js   (Vercel serverless function, production)
 *   - vite.config.ts         (dev middleware, `npm run dev`)
 */

const MAX_BASE64 = 6 * 1024 * 1024; // ~4.5 MB of image data after decoding

export function config() {
  const isProd = Boolean(process.env.VERCEL_ENV || process.env.NODE_ENV === 'production');
  return {
    url: (process.env.ODOO_URL || '').replace(/\/+$/, ''),
    db: process.env.ODOO_DB || '',
    // No hard-coded fallback: this file is published in a public repository.
    // Credentials live in the deployment environment, or in the git-ignored
    // .env.local for local development.
    login: process.env.ODOO_LOGIN || '',
    password: process.env.ODOO_PASSWORD || '',
    isProd,
  };
}

/** Confirms the caller holds an admin JWT for the store API. */
export async function assertAdmin(bearerToken, odooUrl) {
  if (!bearerToken) return { ok: false, status: 401, message: 'Missing Authorization bearer token.' };
  try {
    const r = await fetch(`${odooUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${bearerToken}`, Accept: 'application/json' },
    });
    if (!r.ok) return { ok: false, status: 401, message: `Token rejected by the store API (HTTP ${r.status}).` };
    const body = await r.json();
    if (!body?.data?.is_admin) return { ok: false, status: 403, message: 'This action requires an administrator account.' };
    return { ok: true, user: body.data };
  } catch (e) {
    return { ok: false, status: 502, message: `Could not verify the session: ${e.message}` };
  }
}

/** Minimal Odoo JSON-RPC client with a single session cookie. */
export function odooClient(cfg) {
  let cookie = '';
  return {
    async authenticate() {
      const r = await fetch(`${cfg.url}/web/session/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'call',
          params: { db: cfg.db, login: cfg.login, password: cfg.password },
        }),
      });
      const setCookie = r.headers.getSetCookie?.() || [];
      cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
      const d = await r.json();
      if (d.error) throw new Error(d.error.data?.message || 'Odoo authentication failed');
      if (!d.result?.uid) throw new Error('Odoo authentication failed (no uid)');
      return d.result.uid;
    },
    async call(model, method, args, kwargs = {}) {
      const r = await fetch(`${cfg.url}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { model, method, args, kwargs } }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.data?.message || `${model}.${method} failed`);
      return d.result;
    },
  };
}

/**
 * Writes an image onto a product identified by its public UUID.
 * @returns {Promise<{status:number, body:object}>}
 */
export async function writeProductImage({ bearerToken, productId, dataBase64, filename }) {
  const cfg = config();

  if (!cfg.login || !cfg.password) {
    return {
      status: 503,
      body: {
        success: false,
        error: {
          code: 'not_configured',
          message: 'Image upload is not configured. Set ODOO_LOGIN and ODOO_PASSWORD in the deployment environment.',
        },
      },
    };
  }

  const auth = await assertAdmin(bearerToken, cfg.url);
  if (!auth.ok) {
    return { status: auth.status, body: { success: false, error: { code: 'unauthorized', message: auth.message } } };
  }

  if (!productId || typeof productId !== 'string') {
    return { status: 400, body: { success: false, error: { code: 'validation_error', message: 'product_id is required.' } } };
  }
  if (!dataBase64 || typeof dataBase64 !== 'string') {
    return { status: 400, body: { success: false, error: { code: 'validation_error', message: 'data_base64 is required.' } } };
  }

  // strip a possible data: URL prefix
  const b64 = dataBase64.replace(/^data:[^;]+;base64,/, '');
  if (b64.length > MAX_BASE64) {
    return {
      status: 413,
      body: { success: false, error: { code: 'payload_too_large', message: `Image exceeds the ${Math.round(MAX_BASE64 / 1e6)} MB limit.` } },
    };
  }
  if (!/^[A-Za-z0-9+/=\s]+$/.test(b64)) {
    return { status: 400, body: { success: false, error: { code: 'validation_error', message: 'data_base64 is not valid base64.' } } };
  }

  try {
    const odoo = odooClient(cfg);
    await odoo.authenticate();

    const ids = await odoo.call('product.template', 'search', [[['selection_public_id', '=', productId]]]);
    if (!ids.length) {
      return { status: 404, body: { success: false, error: { code: 'not_found', message: `No product with id ${productId}.` } } };
    }

    await odoo.call('product.template', 'write', [ids, { image_1920: b64 }]);

    return {
      status: 200,
      body: {
        success: true,
        data: {
          product_id: productId,
          // cache-buster so the browser picks up the new bytes immediately
          url: `${cfg.url}/api/images/product.template/${productId}?unique=${Date.now()}`,
          filename: filename || null,
        },
      },
    };
  } catch (e) {
    return { status: 502, body: { success: false, error: { code: 'odoo_error', message: e.message } } };
  }
}
