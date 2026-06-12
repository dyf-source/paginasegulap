import { productosData, defaultConfig } from "../shared/data.js";

const PRODUCTS_KEY = "products";
const CATEGORIES_KEY = "categories_config";
const WHATSAPP_KEY = "whatsapp";

function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestPost({ env }) {
  const existing = await env.segulap_kv.get(PRODUCTS_KEY);
  if (existing) {
    return json({ message: "Database already seeded. Delete KV keys manually to re-seed." });
  }

  await env.segulap_kv.put(PRODUCTS_KEY, JSON.stringify(productosData));
  await env.segulap_kv.put(CATEGORIES_KEY, JSON.stringify(defaultConfig));
  await env.segulap_kv.put(WHATSAPP_KEY, "5492216746874");

  return json({
    message: "Seeded successfully",
    products: productosData.length,
    categories: defaultConfig.categories.length,
    groups: Object.keys(defaultConfig.groups).length,
  });
}

export async function onRequestGet({ env }) {
  const hasProducts = await env.segulap_kv.get(PRODUCTS_KEY);
  const hasConfig = await env.segulap_kv.get(CATEGORIES_KEY);

  return json({
    seeded: !!(hasProducts && hasConfig),
    products: hasProducts ? JSON.parse(hasProducts).length : 0,
  });
}
