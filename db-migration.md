# Migrating data to KV

There are two ways to get your product data into KV.

## Option 1: Seed endpoint (easiest)

The `POST /api/seed` endpoint populates KV from the hardcoded data in `functions/shared/data.js` (same data as `assets/js/productos.js`).

After deploying or running `wrangler pages dev`:

```
curl -X POST http://localhost:8788/api/seed
```

Or in production:

```
curl -X POST https://tusitio.pages.dev/api/seed
```

Check if already seeded:

```
curl http://localhost:8788/api/seed
```

Returns `{ "seeded": true, "products": 375 }`.

---

## Option 2: Import `assets/productos.json` via the admin panel

The file `assets/productos.json` uses the format `{ "cat": "...", "tag": "...", "image": null }`, but the admin expects `{ "name": "...", "cat": "...", "desc": "", "img": "" }`.

To migrate it, transform the file first. Run this in PowerShell from the project root:

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

Then open `/admin/`, log in, and click **Importar JSON** → select `productos-import.json`. The admin will push the data to KV via the API.

---

## What gets stored in KV

| Key | Value |
|-----|-------|
| `products` | Full JSON array of `{ name, cat, desc, img }` |
| `categories_config` | `{ categories: [...], groups: {...}, colors: {...} }` |
| `whatsapp` | Phone number string |

---

## Reseeding

If you need to reset KV and start fresh, delete the keys first (easiest from the Cloudflare dashboard under KV, or via the API), then re-seed.

During local dev, just restart `wrangler pages dev` — the local emulator starts clean each time.
