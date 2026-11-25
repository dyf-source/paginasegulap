// Admin-only site settings write. Served at /admin/api/settings, gated by
// the Cloudflare Access policy on /admin/*. Public reads stay at /api/settings.
const KV_KEY = "site_settings";

// Allowed keys and their validators; anything else in the body is ignored.
const FIELDS = {
  whatsappAutomatizacion: (v) => typeof v === "string" && /^\d{8,15}$/.test(v),
  // Display form of the same number, e.g. "+54 9 221 651-5377"
  phoneAutomatizacion: (v) => typeof v === "string" && /^[\d +()\-.]{8,30}$/.test(v),
};

function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "object body required" }, 400);

  const raw = await env.segulap_kv.get(KV_KEY);
  const settings = raw ? JSON.parse(raw) : {};

  for (const key of Object.keys(FIELDS)) {
    if (!(key in body)) continue;
    if (!FIELDS[key](body[key])) return json({ error: `invalid value for ${key}` }, 400);
    settings[key] = body[key];
  }

  await env.segulap_kv.put(KV_KEY, JSON.stringify(settings));
  return json(settings);
}
