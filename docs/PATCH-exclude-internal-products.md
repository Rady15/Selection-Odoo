# Patch — exclude Odoo internal products from the public catalog

**Defect:** D2 in `docs/API-CYCLE-REPORT.md`
**Target:** `selection_store_backend` (Odoo 18.0.2.3.0)
**Status:** specification + drop-in helper. The addon source is **not** in this repository
(this repo is the React storefront), so this file must be applied on the Odoo server.

> **Interim fix already applied (4 Nov 2026).** The 22 internal records were
> archived directly through `DELETE /api/products/{id}`, which dropped the
> catalogue from 508 to 486 and cleared `meta.total` and search immediately.
> One record was kept on purpose: `[6426] CAFETTO LOD® Green Liquid Descaler
> 5Liter` is real merchandise that is merely out of stock — move it to a proper
> category instead of archiving it.
>
> Archiving is a **one-off data fix, not a durable rule**. The moment a new POS
> config, loyalty program or expense product is created, it will leak again. The
> patch below is what prevents that.

---

## 1. What is leaking

`GET /api/products` returns five Odoo system records:

| Product | Odoo origin | `categ_name` |
|---|---|---|
| `Tips` | POS tip product (`pos.config.tip_product_id`) | `All / Saleable / PoS` |
| `Down Payment (POS)` | POS down payment (`pos.config.down_payment_product_id`) | `All / Saleable / PoS` |
| `Discount` | discount / loyalty reward line (`product.template.is_reward_line`) | `All / Saleable / PoS` |
| `Gift Card` | loyalty gift-card program (`loyalty.program.gift_card_product_id`) | `All` |
| `Top-up eWallet` | loyalty eWallet program (`loyalty.program.ewallet_product_id`) | `All` |

The API guide (§6) already promises *"Internal discount/adjustment products are
excluded"* — the addon's exclusion list simply does not cover Odoo's own POS and
loyalty products, only the storefront's custom adjustment products.

### The leak is larger than the five reported products

A full scan of all 508 catalogue records found **23** internal records, not 5.
The other 18 are expense/administrative items filed under `All / Expenses` and
`All / Shipping Expenses`:

```
Expenses · Gas Expenses · Gas Consumption Expenses · Petrol Expenses
Stationery Expenses · Shipping Expenses · Professional Services
Rebranding Services · Penalties / Fines · Others · ICV Certificate
VISA Renewal · VAT Saudi Drip Coffee · VAT Saudi Mix Box
Discount · Down payment · Gift Card (duplicate records)
```

Those categories also contain **real, sellable merchandise** — the Cafetto
descalers and `KIT WATER HARDNESS`. They must survive, which is why the rule
below keys on `sale_ok` / `can_be_expensed` / purchasability rather than on the
category name alone.

**Why it must be fixed server-side.** The storefront can hide them from what a
customer sees (see §5), but only the addon can fix:

- `meta.total` (the counter),
- `q=` search matches,
- every filter (`category`, `flag`, `origin`, `in_stock`, …),
- non-browser clients (the mobile app reads the same JSON),
- `GET /api/products/{uuid}` reachability.

---

## 2. The rule

A product is internal when **any** of the following holds:

1. `product.template.is_reward_line = True` — loyalty discount/reward lines.
2. It is the configured tip or down-payment product of any POS config.
3. It is the gift-card or eWallet product of any loyalty program.
4. It is the company/sales discount product (stored in `ir.config_parameter`).
5. `product.template.can_be_expensed = True` — expense/administrative lines
   (`VISA Renewal`, `Petrol Expenses`, `Penalties / Fines`, …).
6. `product.template.sale_ok = False` — nothing that cannot be sold belongs in a
   shop catalogue.

Rules 5–6 are what clean up `All / Expenses` while leaving the Cafetto descalers
alone: those are `sale_ok = True`, `can_be_expensed = False`, and in stock.

Everything else stays. Do **not** filter on `type = 'service'`, price `0`, or
"no image / no description" — real spare parts and accessories in this catalogue
match those and would disappear (verified: `Profitec - Inlet Pipe Brewing Group
P2524`).

---

## 3. Helper module

Add `models/selection_catalog_policy.py`:

```python
# -*- coding: utf-8 -*-
"""Public catalog eligibility for the Selection Store API.

Odoo creates several products that exist only to support POS/loyalty
bookkeeping. They must never be sold or listed on the storefront.
"""

from odoo import api, models

#: ir.config_parameter keys that may hold a discount product id.
_DISCOUNT_PARAM_KEYS = (
    'sale.default_discount_product_id',
    'website_sale.discount_product_id',
    'pos.discount_product_id',
)


def selection_internal_product_ids(env):
    """Return the set of ``product.product`` ids that must not be published.

    Every lookup is guarded by a field-existence check so the module keeps
    working when ``pos`` / ``loyalty`` / ``sale`` are not installed.
    """
    Product = env['product.product'].sudo()
    ids = set()

    # 1. Loyalty reward / discount lines.
    if 'is_reward_line' in env['product.template']._fields:
        ids.update(
            Product.search([('is_reward_line', '=', True)]).ids
        )

    # 2. POS tip and down-payment products.
    if 'pos.config' in env:
        config_model = env['pos.config'].sudo()
        for fname in ('tip_product_id', 'down_payment_product_id'):
            if fname not in config_model._fields:
                continue
            for config in config_model.search([(fname, '!=', False)]):
                product = config[fname]
                if product:
                    ids.update(product.product_variant_ids.ids)

    # 3. Gift-card and eWallet products declared on loyalty programs.
    if 'loyalty.program' in env:
        program_model = env['loyalty.program'].sudo()
        for fname in ('gift_card_product_id', 'ewallet_product_id'):
            if fname not in program_model._fields:
                continue
            for program in program_model.search([(fname, '!=', False)]):
                product = program[fname]
                if product:
                    ids.update(product.product_variant_ids.ids)

    # 4. Discount product configured through Sales / Website settings.
    ICP = env['ir.config_parameter'].sudo()
    for key in _DISCOUNT_PARAM_KEYS:
        raw = ICP.get_param(key)
        if raw and str(raw).isdigit():
            ids.update(Product.browse(int(raw)).exists().ids)

    # 5-6. Expense lines, and anything that cannot be sold.
    #      Keyed on sale_ok rather than on the category name so that real
    #      merchandise misfiled under "All / Expenses" (Cafetto descalers,
    #      water-hardness kits) keeps its place in the catalogue.
    Template = env['product.template'].sudo()
    if 'can_be_expensed' in Template._fields:
        ids.update(Product.search([('can_be_expensed', '=', True)]).ids)
    if 'sale_ok' in Template._fields:
        ids.update(Product.search([('sale_ok', '=', False)]).ids)

    return ids


def selection_catalog_domain(env, domain=None):
    """Extend a product domain with the internal-product exclusion."""
    domain = list(domain or [])
    internal = selection_internal_product_ids(env)
    if internal:
        domain.append(('id', 'not in', sorted(internal)))
    return domain
```

Register it in `models/__init__.py`:

```python
from . import selection_catalog_policy
```

---

## 4. Where to apply it

The addon builds product domains in **one** place — the helper used by
`GET /api/products`, its count, and the detail route. In this addon that is the
product-search method of the API controller/service (search for the method that
returns the base domain, typically `_product_domain`, `_get_products_domain` or
an inline `search(domain, limit=..., offset=...)`).

Wrap **that single domain**, before pagination:

```python
from .selection_catalog_policy import selection_catalog_domain

domain = selection_catalog_domain(request.env, domain)
products = request.env['product.template'].search(domain, limit=limit, offset=offset)
total = request.env['product.template'].search_count(domain)   # ← meta.total fixed here
```

Two rules for a correct fix:

1. **One choke point.** The list, the `search_count` and the detail lookup must
   all receive the extended domain. If the count uses a separate domain literal,
   patch that one too — otherwise the counter keeps reporting 509.
2. **Before pagination.** Appending the clause after `search()` gives the right
   page contents but the wrong `meta.total` and a short page at the boundary.

### Detail route

`GET /api/products/{uuid|slug}` resolves by UUID/slug rather than by domain, so
add the same check explicitly:

```python
internal = selection_internal_product_ids(request.env)
if product.id in internal:
    raise NotFound()   # same 404 used for unknown products
```

### Optional — expose the flag

Serialising the flag lets clients filter defensively (the storefront already
honours it):

```python
'is_internal': product.id in selection_internal_product_ids(request.env),
```

Cache `selection_internal_product_ids()` per request (or per 60 s) — it runs a
handful of `search()` calls and should not execute once per product row.

---

## 5. Storefront guard already shipped

`src/utils/catalogPolicy.ts` filters the same records at the API boundary, so the
web storefront is correct **today**, before the backend is redeployed:

- listing, search overlay, homepage carousel, related products → filtered;
- the displayed count is `filteredProducts.length`, so it drops from 508 to 485
  (23 records removed on the current staging data);
- direct links to an internal product resolve to 404;
- `?include_internal=1` opts the admin product manager back in (the flag is
  stripped before the request reaches Odoo).

Its rule is deliberately narrower than the server-side one: a product with any
purchasable variant is always kept, so real merchandise misfiled in
`All / Expenses` stays visible. One consequence — an out-of-stock item in an
internal category (e.g. `[6426] CAFETTO LOD® Green Liquid Descaler 5Liter`) is
hidden until it is restocked or moved to a proper category. That is the
acceptable side of the trade-off; the server-side rule, which can read
`sale_ok`, does not have this limitation.

This is defence in depth, not a replacement. It cannot fix `meta.total` or the
mobile client.

---

## 6. Verification

After deploying the addon patch:

```bash
B=https://<your-host>

# 1. none of the system products may appear in the catalogue
curl -s "$B/api/products?lang=en&limit=100" \
  | grep -Eo '"name": "(Tips|Down Payment \(POS\)|Discount|Gift Card|Top-up eWallet)"' \
  || echo "OK — no internal products"

# 2. the counter must drop (508 → ~485 on current data)
curl -s "$B/api/products?limit=1" | grep -o '"total": [0-9]*'

# 3. search must not find them
curl -s "$B/api/products?q=discount"  | grep -c '"id"'             # 0
curl -s "$B/api/products?q=gift"      | grep -c '"id"'             # 0
curl -s "$B/api/products?q=expenses"  | grep -c '"id"'             # 0

# 4. a direct link must 404
curl -s -o /dev/null -w '%{http_code}\n' \
  "$B/api/products/e3995223-d35e-4afd-ad8a-486fc9690176"           # 404

# 5. real products must survive — including the ones misfiled in Expenses
curl -s "$B/api/products?q=Profitec" | grep -c '"id"'              # unchanged
curl -s "$B/api/products?q=Cafetto"  | grep -c '"id"'              # unchanged
```

Then re-run the cycle suite and the policy check:

```bash
node tests/e2e-cycle.mjs            # D2 assertion must turn green
node tests/verify-catalog-policy.mjs
```

---

## 7. Rollback

The change is additive — a domain clause and one 404 guard. Revert the two
call sites (or remove `selection_catalog_policy.py` from `models/__init__.py`)
and restart the Odoo service. No data is mutated, no migration is required.
