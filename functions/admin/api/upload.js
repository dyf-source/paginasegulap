// Admin-only image upload to R2. POST /admin/api/upload with the raw image as the
// request body and its MIME type as Content-Type. Gated by Cloudflare Access on
// /admin/*. Returns { path: "/img/<key>" } to store in the product's `img` field.
function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function extFor(ct) {
  const map = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif",
  };
  return map[(ct || "").toLowerCase()] || "bin";
}

export async function onRequestPost({ request, env }) {
  const ct = request.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) {
    return json({ error: "request body must be an image (set Content-Type: image/*)" }, 400);
  }

  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) {
    return json({ error: "empty image body" }, 400);
  }
  if (buf.byteLength > 10 * 1024 * 1024) {
    return json({ error: "image too large (max 10 MB)" }, 413);
  }

  const key = `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${extFor(ct)}`;
  await env.segulap_images.put(key, buf, { httpMetadata: { contentType: ct } });

  return json({ path: `/img/${key}`, key });
}
