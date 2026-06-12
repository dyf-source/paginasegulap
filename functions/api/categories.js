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

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  if (!body || !body.categories) {
    return json({ error: "categories array is required" }, 400);
  }

  const config = {
    categories: body.categories,
    groups: body.groups || {},
    colors: body.colors || {},
  };

  await env.segulap_kv.put(KV_KEY, JSON.stringify(config));
  return json(config);
}
