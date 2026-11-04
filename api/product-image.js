/**
 * POST /api/product-image
 *
 * Body (JSON):
 *   { product_id: "<public uuid>", data_base64: "<...>", filename?: "x.jpg" }
 *
 * Auth: requires an administrator bearer token from the store API.
 * Writes product.template.image_1920 via Odoo JSON-RPC and returns the public
 * image URL. See server/productImage.js for the rationale.
 */
import { writeProductImage } from '../server/productImage.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: { code: 'method_not_allowed', message: 'Use POST.' } });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const bearerToken = String(authHeader).replace(/^Bearer\s+/i, '').trim();

  const { status, body: out } = await writeProductImage({
    bearerToken,
    productId: body.product_id,
    dataBase64: body.data_base64,
    filename: body.filename,
  });

  res.status(status).json(out);
}
