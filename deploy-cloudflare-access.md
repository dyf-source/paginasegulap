# Protecting the Admin Panel with Cloudflare Access

## Overview

This adds an authentication gate at Cloudflare's edge for `/admin/*`. Unauthenticated users never see a byte of the admin page.

Crucially, the data-mutation API lives under the same path: all writes are served
at `/admin/api/*` (`/admin/api/products`, `/admin/api/categories`,
`/admin/api/seed`), so a single Access policy on `/admin/*` protects **both** the
admin UI and the endpoints that modify the database. Public read-only endpoints
stay at `/api/*` (`GET /api/products`, `GET /api/categories`) and remain open for
the storefront. Make sure the Access application's path is `/admin/*` (with the
wildcard) so it covers `/admin/api/*` too.

## Prerequisites

- Domain proxied through Cloudflare (orange cloud in DNS)
- Cloudflare Pages site deployed to that domain
- Cloudflare Zero Trust enabled (free tier: up to 50 users)

## Steps

### 1. Enable Cloudflare Zero Trust

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Zero Trust** (left sidebar)
3. Follow the on-screen setup if this is your first time (free plan works fine)

### 2. Create an Access Application

1. In Zero Trust → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**

**Application configuration:**

| Field | Value |
|-------|-------|
| Application name | `Segulap Admin` |
| Session duration | `24h` (or your preference) |
| **Application domain** | |
| Domain | `yourdomain.com` |
| Path | `/admin/*` |

4. Click **Next**

### 3. Set Up Identity Provider

1. Under **Identity providers**, choose one:
   - **Google** — built-in, users sign in with their Google account
   - **GitHub** — built-in
   - **One-time PIN** — email-based PIN (simplest, no account needed)
2. Configure as needed (Google/GitHub usually just needs OAuth consent)
3. Click **Next**

### 4. Create Access Policy

| Field | Value |
|-------|-------|
| Policy name | `Admin access` |
| Action | `Allow` |

**Configure rules (choose one):**

- **Email — `your-email@gmail.com`** (single user)
- **Emails ending in — `@yourcompany.com`** (whole domain)
- **Everyone** (any authenticated user — less restrictive)

4. Click **Next**, review, and click **Add application**

### 5. Verify

- Visit `https://yourdomain.com/admin/`
- You should be redirected to a Cloudflare login page
- After authenticating, you reach the admin panel

### First-time seed (after deploy)

Because `/admin/api/seed` is behind Access, you cannot `curl` it in production
without a service token. After the first deploy, open `https://yourdomain.com/admin/`,
authenticate, and click **Inicializar BD** in the Productos toolbar to populate KV
from the bundled catalog. (Locally, without Access, `curl -X POST
http://localhost:8788/admin/api/seed` still works.)

## Local Development

Cloudflare Access only applies to the production domain. Local dev (`localhost`,
`file://`) is unaffected. Note that with the password removed (below), the admin
panel is **open** on localhost — that is expected, since Access is the only gate
and it doesn't run locally.

## Removing the Old Password Code

The hardcoded password (`ADMIN_PASSWORD = 'segulap2024'`) and the client-side
login screen in `admin/index.html` have been removed. The panel now loads directly
and relies entirely on Cloudflare Access at the edge; **Cerrar sesión** redirects
to `/cdn-cgi/access/logout`. Do not re-introduce a client-side password — it was
trivially bypassable via view-source.
