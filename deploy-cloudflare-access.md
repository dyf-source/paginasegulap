# Protecting the Admin Panel with Cloudflare Access

## Overview

This adds an authentication gate at Cloudflare's edge for `/admin/*`. Unauthenticated users never see a byte of the admin page. No code changes needed — the site stays fully static.

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

## Local Development

Cloudflare Access only applies to the production domain. Local dev (`localhost`, `file://`) is unaffected — you continue working as normal.

## Removing the Old Password Code

The hardcoded password (`ADMIN_PASSWORD`) in `admin/index.html` is no longer needed and has been removed. Authentication is now handled by Cloudflare at the edge.
