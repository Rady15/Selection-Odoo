import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

/**
 * Dev-only stand-in for the Vercel serverless function at api/product-image.js.
 *
 * `enforce: 'pre'` is essential: Vite installs its /api proxy as a normal
 * plugin, so a normal plugin's middleware would run *after* it and the request
 * would be forwarded to Odoo (which 404s). Running first lets us answer locally.
 */
function productImageDevRoute(env) {
  return {
    name: 'product-image-dev-route',
    enforce: 'pre' as const,
    configureServer(server) {
      // expose .env values to the shared server module
      for (const key of ['ODOO_URL', 'ODOO_DB', 'ODOO_LOGIN', 'ODOO_PASSWORD']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }

      server.middlewares.use('/api/product-image', (req, res, next) => {
        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: { code: 'method_not_allowed', message: 'Use POST.' } }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(Buffer.from(c)));
        req.on('end', async () => {
          let body: any = {};
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { body = {}; }

          const authHeader = String(req.headers.authorization || '');
          const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

          try {
            const { writeProductImage } = await import('./server/productImage.js');
            const { status, body: out } = await writeProductImage({
              bearerToken,
              productId: body.product_id,
              dataBase64: body.data_base64,
              filename: body.filename,
            });
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(out));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: { code: 'server_error', message: e?.message || 'failed' } }));
          }
        });
        req.on('error', next);
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  // The proxy target must be an ORIGIN. `VITE_API_BASE_URL` is also used to
  // absolutize media URLs and has historically carried a `/odoo` suffix, which
  // made the dev proxy request `/odoo/api/...` and 404 every call.
  const rawTarget = env.ODOO_URL || env.VITE_API_BASE_URL || 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com';
  let apiTarget = rawTarget.replace(/\/+$/, '');
  try { apiTarget = new URL(rawTarget).origin; } catch { /* keep the raw value */ }
  return {
    plugins: [productImageDevRoute(env), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
