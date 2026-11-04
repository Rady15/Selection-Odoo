import { useState, useEffect } from 'react';

export interface ReviewSummary {
  count: number;
  avg: number;
}

// Session-wide cache: each product's reviews are fetched at most once no
// matter how many cards/rows render it (homepage carousels, listing grids).
const cache = new Map<string, ReviewSummary>();
const pending = new Map<string, Promise<ReviewSummary>>();

function loadSummary(productId: string): Promise<ReviewSummary> {
  const hit = cache.get(productId);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(productId);
  if (inflight) return inflight;
  const req = fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`)
    .then(r => (r.ok ? r.json() : []))
    .then((data: any) => {
      const list = Array.isArray(data) ? data : [];
      const summary: ReviewSummary =
        list.length > 0
          ? {
              count: list.length,
              avg: list.reduce((s: number, r: any) => s + Number(r?.rating || 0), 0) / list.length,
            }
          : { count: 0, avg: 0 };
      cache.set(productId, summary);
      pending.delete(productId);
      return summary;
    })
    .catch(() => {
      pending.delete(productId);
      return { count: 0, avg: 0 };
    });
  pending.set(productId, req);
  return req;
}

/** Live review count/average for a product (the product payload has none). */
export function useReviewSummary(productId: string | undefined): ReviewSummary | null {
  const [summary, setSummary] = useState<ReviewSummary | null>(
    () => (productId ? cache.get(productId) || null : null)
  );

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    loadSummary(productId).then(s => {
      if (!cancelled) setSummary(s);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return summary;
}

export default useReviewSummary;
