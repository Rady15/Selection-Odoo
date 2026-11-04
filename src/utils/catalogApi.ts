/**
 * Catalogue fetching helpers.
 *
 * `GET /api/products` is paginated: the backend defaults to 24 items and
 * caps `limit` at 100 (asking for 500 still returns 100). A single
 * `fetch('/api/products')` therefore returns the first 24 products of a
 * ~475-product catalogue — which is why the storefront only ever showed a
 * fraction of it, and why client-side filters looked broken: they were
 * filtering a 24-item slice.
 *
 * `fetchAllProducts` walks every page and de-duplicates by id, so any screen
 * that needs the full catalogue (listing, search, wishlist) sees all of it.
 */

export const CATALOG_PAGE_SIZE = 100;

/** Normalise the several shapes a list endpoint can return into an array. */
export function asArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

/**
 * Fetch every product matching `params`.
 *
 * Page count comes from the `x-catalog-pages` header that the API wrapper
 * adds when it unwraps the `{success, data, meta}` envelope. Without that
 * header (a raw backend response) we walk pages until one comes back short.
 */
export async function fetchAllProducts(params: Record<string, string> = {}): Promise<any[]> {
  const base = new URLSearchParams({ ...params, limit: String(CATALOG_PAGE_SIZE), page: '1' });

  const firstRes = await fetch(`/api/products?${base.toString()}`);
  const items = asArray(await firstRes.json());

  const headerPages = Number(firstRes.headers?.get?.('x-catalog-pages'));
  const pages = Number.isFinite(headerPages) && headerPages > 0
    ? headerPages
    : items.length >= CATALOG_PAGE_SIZE ? 2 : 1;

  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => {
        const p = new URLSearchParams(base);
        p.set('page', String(i + 2));
        return fetch(`/api/products?${p.toString()}`)
          .then((r) => r.json())
          .then(asArray)
          .catch(() => [] as any[]);
      })
    );
    return dedupe([...items, ...rest.flat()]);
  }

  if (items.length < CATALOG_PAGE_SIZE) return dedupe(items);

  // No header and a full first page: keep walking until a short page.
  const all = [...items];
  for (let page = 2; page <= 25; page++) {
    const p = new URLSearchParams(base);
    p.set('page', String(page));
    const next = asArray(await fetch(`/api/products?${p.toString()}`).then((r) => r.json()).catch(() => []));
    if (!next.length) break;
    all.push(...next);
    if (next.length < CATALOG_PAGE_SIZE) break;
  }
  return dedupe(all);
}

function dedupe(list: any[]): any[] {
  const seen = new Map<string, any>();
  for (const item of list) {
    if (!item || item.id == null) continue;
    seen.set(String(item.id), item);
  }
  return [...seen.values()];
}

/** Fetch the public category tree, flattened. */
export async function fetchCategories(): Promise<any[]> {
  const payload = await fetch('/api/categories').then((r) => r.json());
  return asArray(payload);
}
