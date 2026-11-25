// Public, read-only site settings (e.g. per-page WhatsApp numbers). Served at /api/settings.
// Writes live at /admin/api/settings behind the Cloudflare Access gate.
const KV_KEY = "site_settings";

function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      // Short cache so admin changes show up within a minute
      "Cache-Control": "public, max-age=60",
    },
  });
}

export async function onRequestGet({ env }) {
  const raw = await env.segulap_kv.get(KV_KEY);
  return json(raw ? JSON.parse(raw) : {});
}
