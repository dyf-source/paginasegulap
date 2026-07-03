// Public, read-only categories/groups config. Served at /api/categories.
// Writes live at /admin/api/categories behind the Cloudflare Access gate.
const KV_KEY = "categories_config";

function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestGet({ env }) {
  const raw = await env.segulap_kv.get(KV_KEY);
  if (!raw) {
    return json({ categories: [], groups: {}, colors: {} });
  }
  return json(JSON.parse(raw));
}
