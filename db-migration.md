# Migrating data to KV

The live site reads its catalog from **Cloudflare KV**, not from the files in the
repo. There are three representations of the data and they must be kept in sync
manually:

| Source | Role |
|--------|------|
| `functions/shared/data.js` | Server defaults (`productosData`, `categories`, `categoryGroups`, `defaultConfig`). Seeds KV. |
| `assets/js/productos.js` | Client fallback, used only when the API is unreachable. Must mirror `data.js`. |
| **Cloudflare KV** | The live source read via `/api/products` + `/api/categories`. |

Editing the two files does **not** change production. KV must be pushed
separately (see below).

**Read vs write split:** public read-only endpoints live at `/api/*`
(`GET /api/products`, `GET /api/categories`) and stay open for the storefront.
All writes live at `/admin/api/*` (`/admin/api/products`, `/admin/api/categories`,
`/admin/api/seed`) and sit behind the Cloudflare Access policy on `/admin/*`.
In production you cannot `curl` the write/seed endpoints without an Access token;
use the admin panel (which runs inside the Access session) instead.

Current data set: **372 products**, **69 categories**, **10 groups**
(EPP, Indumentaria, Calzado de Seguridad, Vial y Tránsito, Kits Antiderrame,
Seguridad en Altura, Extintores, Carteles y Señalización, Red contra Incendios,
Izaje y Remolque).

---

## Category groups (parents/drawers)

Categories are either **top-level** or a **child** of a group. A group's name is
the **parent**; on the products page it renders as an expandable drawer, and
`?cat=<parent>` preselects the parent plus all its children. This is defined by
`categoryGroups` (`groups` in the stored config): a map of `parent -> [children]`.

Parents and children are managed from the **admin panel** (`/admin/`):

- Each category's **Grupo padre** dropdown assigns it to a group (or "Ninguno"
  for top-level). This is how you re-parent or promote a category.
- **+ Agregar grupo** creates a parent group and ticks its child categories.
- Deleting a parent reassigns its children to **Otros**.

Admin changes save straight to KV via `POST /api/categories`, so they take effect
on the live site immediately but do **not** touch `data.js` / `productos.js`. Keep
the files in sync if you want the seed/fallback to match.

---

## What gets stored in KV

| Key | Value |
|-----|-------|
| `products` | Full JSON array of `{ name, cat, desc, img }` |
| `categories_config` | `{ categories: [...], groups: {...}, colors: {...} }` |
| `whatsapp` | Phone number string |

All API responses are wrapped as `{ "ok": <bool>, "data": <payload> }`.

---

## Option 1: Seed endpoint (first-time only)

`POST /admin/api/seed` populates KV from `functions/shared/data.js`. It **refuses
to run if KV is already seeded** (returns `"Database already seeded..."`), so it is
only for a fresh/empty namespace. To push changes to an already-seeded KV, use
Option 2.

**In production** this endpoint is behind Cloudflare Access, so `curl` won't reach
it without a service token. Instead, open `/admin/` (authenticate via Access) and
click **Inicializar BD** in the Productos toolbar. That button POSTs to
`/admin/api/seed` from inside the authenticated session.

**Locally** (`wrangler pages dev`, no Access) you can curl it directly:

```
curl -X POST http://localhost:8788/admin/api/seed
```

Check status (works locally; in prod use the admin panel):

```
curl http://localhost:8788/admin/api/seed
```

Returns `{ "ok": true, "data": { "seeded": true, "products": 372 } }`.

---

## Option 2: Push updates to an already-seeded KV

This is the path for the current data (drawer groups + re-tagged products) once KV
already exists. Two bulk writes, one per key. Both are behind Access in production,
so use the admin panel there; the curl forms below work locally.

**Products** — bulk replace via `PUT /admin/api/products` with `{ products: [...] }`:

```
curl -X PUT http://localhost:8788/admin/api/products \
  -H "Content-Type: application/json" \
  --data-binary @products-import.json
```

where `products-import.json` is `{ "products": [ { "name", "cat", "desc", "img" }, ... ] }`.

**Categories + groups** — `POST /admin/api/categories` with the full config:

```
curl -X POST http://localhost:8788/admin/api/categories \
  -H "Content-Type: application/json" \
  -d '{ "categories": [...], "groups": {...}, "colors": {...} }'
```

`categories` is required; `groups` and `colors` default to empty if omitted.

The admin panel does both of these for you (import JSON for products, the category
and group modals for the config), so in production the UI is the only way (Access
gates the raw endpoints). Verify afterward with the public reads
`GET /api/products` and `GET /api/categories`.

---

## Option 3: Import `assets/productos.json` via the admin panel

Note: `assets/productos.json` predates the re-tagging into drawer children, so its
`cat` values are the old flat categories. It is fine as a raw import source but the
categories will not match the current group structure without re-tagging.

The file uses the format `{ "cat": "...", "tag": "...", "image": null }`, but the
admin expects `{ "name": "...", "cat": "...", "desc": "", "img": "" }`. Transform
it first. Run this in PowerShell from the project root:

```powershell
$raw = Get-Content -Raw -Path "assets/productos.json" | ConvertFrom-Json
$transformed = $raw | ForEach-Object {
    [PSCustomObject]@{
        name = $_.tag
        cat  = $_.cat
        desc = ""
        img  = if ($_.image) { $_.image } else { "" }
    }
}
$transformed | ConvertTo-Json -Depth 2 | Set-Content -Path "productos-import.json"
```

Then open `/admin/`, log in, and click **Importar JSON** -> select
`productos-import.json`. The admin pushes the data to KV via the API.

---

## Reseeding

To reset KV and start fresh, delete the keys first (from the Cloudflare dashboard
under KV, or with `wrangler kv key delete`), then re-run the seed (**Inicializar
BD** in the admin panel, or `POST /admin/api/seed` locally). Because seed refuses
to overwrite an existing DB, deleting `products` and `categories_config` is
required before a re-seed will do anything.

During local dev, the `.wrangler/` KV emulator state persists between
`wrangler pages dev` runs, so a local seed sticks until you delete
`.wrangler/state` or the keys.
