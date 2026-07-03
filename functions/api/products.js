// Public, read-only product listing. Served at /api/products.
// All writes live at /admin/api/products behind the Cloudflare Access gate.
const KV_KEY = "products";

async function getAll(env) {
  const raw = await env.segulap_kv.get(KV_KEY);
  return raw ? JSON.parse(raw) : [];
}

function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.toLowerCase();
  const cat = url.searchParams.get("cat");

  let list = await getAll(env);

  if (cat) {
    list = list.filter((p) => p.cat === cat);
  }
  if (search) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.cat.toLowerCase().includes(search)
    );
  }

  return json(list);
}
