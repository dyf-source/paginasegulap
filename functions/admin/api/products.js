// Admin-only product writes. Served at /admin/api/products, gated by the
// Cloudflare Access policy on /admin/*. Public reads stay at /api/products.
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

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  if (!body || !body.name) {
    return json({ error: "name is required" }, 400);
  }

  const list = await getAll(env);
  list.push({
    name: body.name,
    cat: body.cat || "Otros",
    desc: body.desc || "",
    img: body.img || "",
    thumb: body.thumb || "",
  });
  await env.segulap_kv.put(KV_KEY, JSON.stringify(list));

  return json(list, 201);
}

export async function onRequestPut({ request, env }) {
  const body = await request.json();

  // Bulk replace: PUT /admin/api/products with { products: [...] }
  if (body && body.products && Array.isArray(body.products)) {
    await env.segulap_kv.put(KV_KEY, JSON.stringify(body.products));
    return json(body.products);
  }

  if (!body || !body.name) {
    return json({ error: "name is required" }, 400);
  }

  let list = await getAll(env);
  const idx = list.findIndex((p) => p.name === body.name);
  if (idx === -1) {
    return json({ error: "product not found" }, 404);
  }

  list[idx] = {
    name: body.name,
    cat: body.cat || list[idx].cat,
    desc: body.desc !== undefined ? body.desc : list[idx].desc,
    img: body.img !== undefined ? body.img : list[idx].img,
    // A new img without a thumb invalidates the old thumbnail
    thumb: body.thumb !== undefined ? body.thumb : (body.img !== undefined ? "" : list[idx].thumb || ""),
  };
  await env.segulap_kv.put(KV_KEY, JSON.stringify(list));

  return json(list);
}

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) {
    return json({ error: "name query param is required" }, 400);
  }

  let list = await getAll(env);
  const filtered = list.filter((p) => p.name !== name);
  if (filtered.length === list.length) {
    return json({ error: "product not found" }, 404);
  }

  await env.segulap_kv.put(KV_KEY, JSON.stringify(filtered));
  return json(filtered);
}
