# Migrating to Cloudflare Functions + D1

## Overview

Replaces `localStorage` persistence with a real database. Products, categories, colors, and groups are stored in Cloudflare D1 (serverless SQLite) and accessed via Cloudflare Functions API endpoints. Changes persist across devices and browser sessions.

## Prerequisites

- Node.js 18+
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare Pages project already deployed
- D1 beta enabled (run `wrangler d1 create segulap-db`)

## Files to Create

### `/functions/api/products.js`

```js
// GET /api/products — list all products
// POST /api/products — add a product
// PUT /api/products — update a product
// DELETE /api/products?name=xxx — delete a product
```

Reads/writes the `products` table in D1. Returns `{ ok, data }` JSON.

### `/functions/api/categories.js`

```js
// GET /api/categories — returns { categories: [...], groups: {...}, colors: {...} }
// POST /api/categories — update categories config
```

Reads/writes from the `categories` table (a single row with the JSON config blob).

### `/functions/api/seed.js`

Seeds the database with default data from `productos.js` and `defaultCategoryColors` on first run. Safe to call multiple times (uses `INSERT OR IGNORE`).

## D1 Schema (SQL)

```sql
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cat TEXT NOT NULL DEFAULT 'Otros',
  desc TEXT DEFAULT '',
  img TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  config TEXT NOT NULL
);
```

`categories_config.config` stores the full JSON blob:

```json
{
  "categories": ["Extintores", "Mangueras", ...],
  "groups": { "Elementos de Protección Personal (EPP)": ["Cascos de Seguridad", ...] },
  "colors": { "Extintores": "#e53935", ... }
}
```

## Steps

### 1. Install & Init

```bash
# Already in project root
npx wrangler d1 create segulap-db
# → outputs binding name and database_id
```

Copy the `database_id` from the output.

### 2. Create `wrangler.toml`

```toml
name = "segulap"
pages_build_output_dir = "."
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "segulap-db"
database_id = "<id-from-step-1>"
```

### 3. Create `/functions/api/seed.js`

Loads `productosData`, `categories`, `categoryGroups`, `defaultCategoryColors` from `assets/js/productos.js` (or duplicates the arrays inline) and writes them to D1. One-time run.

### 4. Create `/functions/api/products.js`

Endpoints:

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/products` | Returns all products |
| `GET` | `/api/products?search=x&cat=y` | Filtered query |
| `POST` | `/api/products` | Add product (body: `{ name, cat, desc, img }`) |
| `PUT` | `/api/products` | Update product (body: `{ name, cat, desc, img }`, matched by `name`) |
| `DELETE` | `/api/products?name=xxx` | Delete product |

### 5. Create `/functions/api/categories.js`

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/categories` | Returns `{ categories, groups, colors }` |
| `POST` | `/api/categories` | Saves full config blob (body: `{ categories, groups, colors }`) |

### 6. Update `productos/index.html`

Replace the data-loading preamble:

```js
// Before:
var db;
var stored = localStorage.getItem('segulap_productos');
...

// After:
var db = [];
fetch('/api/products')
  .then(r => r.json())
  .then(d => { if (d.ok) { db = d.data; filterProducts(); } })
  .catch(() => { db = productosData; filterProducts(); });
```

And for categories config, replace the `catConfigStored` block:

```js
var catConfigLoaded = false;
fetch('/api/categories')
  .then(r => r.json())
  .then(d => {
    if (d.ok) {
      activeCategories = d.data.categories;
      activeGroups = d.data.groups;
      activeColors = d.data.colors;
      catConfigLoaded = true;
      rebuildAll();
    }
  })
  .catch(() => { /* fallback to defaults already set */ });
```

### 7. Update `admin/index.html`

Replace `localStorage` reads/writes with `fetch()` calls:

```js
// Load products from API instead of local cache
fetch('/api/products').then(r => r.json()).then(d => {
  if (d.ok) { db = d.data; renderAdminTable(); }
});

// Save product changes via API
function addProduct() {
  // ... build product object ...
  fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }).then(r => r.json()).then(d => { if (d.ok) renderAdminTable(); });
}
```

Same pattern for categories: replace `saveCatConfig()` with `fetch('/api/categories', { method: 'POST', body: ... })`.

### 8. Deploy

```bash
npx wrangler pages deploy .
```

Or connect the repo to Cloudflare Pages dashboard (it auto-detects `wrangler.toml`).

## Migration: Existing localStorage Data

After deploying, run the seed function once to populate D1 with the current data from `productos.js`. Any products created via the admin that only exist in localStorage will be lost — export them first from the admin panel (Exportar JSON button) before migration.

## Local Development

```bash
npx wrangler pages dev . --d1 DB
```

This runs a local dev server with a local D1 instance.

## Risks & Considerations

- **Latency**: Functions add ~50-200ms to page load vs. static data, but cached after first load.
- **Free tier limits**: 500k Function invocations/month, 5GB D1 storage, 5M D1 reads/month. A small business with daily admin use and ~500 page views/day stays well within limits.
- **Single point of failure**: If Cloudflare experiences downtime, the products page won't load dynamic data. Mitigation: keep the static `productos.js` as fallback (already handled by the `.catch()` blocks).
- **No real-time sync**: Two admins editing simultaneously could overwrite each other's changes. D1 doesn't have real-time conflict resolution. Not a concern for single-admin use.
