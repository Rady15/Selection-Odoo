/**
 * Shared Odoo connection settings for the maintenance scripts.
 *
 * Credentials are never hard-coded: they come from the environment, or from
 * `.env.local` / `.env` in the project root. `.env.local` is git-ignored and is
 * the right place for ODOO_LOGIN / ODOO_PASSWORD; `.env` is committed and must
 * stay free of secrets.
 *
 * Every script in this folder talks to a staging Odoo as an administrator, so
 * a missing password is a hard error rather than a silent fallback.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Minimal KEY=VALUE parser — enough for the dotenv files this repo uses. */
function readEnvFile(file) {
  try {
    const out = {};
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** .env.local wins over .env; real process env wins over both. */
export function envValue(key) {
  if (process.env[key]) return process.env[key];
  const local = readEnvFile(path.join(ROOT, '.env.local'));
  if (local[key]) return local[key];
  const shared = readEnvFile(path.join(ROOT, '.env'));
  return shared[key] || '';
}

export function odooConfig({ requireAuth = true } = {}) {
  const url = (envValue('ODOO_URL') || envValue('VITE_API_BASE_URL') || '').replace(/\/+$/, '');
  const db = envValue('ODOO_DB') || (url ? url.replace(/^https?:\/\//, '').split('.')[0] : '');
  const login = envValue('ODOO_LOGIN');
  const password = envValue('ODOO_PASSWORD');

  if (!url) {
    throw new Error('ODOO_URL is not set. Add it to .env.local (or set the env var).');
  }
  if (requireAuth && (!login || !password)) {
    throw new Error(
      'ODOO_LOGIN / ODOO_PASSWORD are not set.\n' +
      '  Put them in .env.local (git-ignored), not in .env:\n' +
      '    ODOO_LOGIN=...\n    ODOO_PASSWORD=...'
    );
  }

  return { url, db, login, password };
}
