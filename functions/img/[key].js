// Public image serving from R2. GET /img/<key> streams the stored object.
// Keys are unique per upload, so responses are cached immutably at the edge.
export async function onRequestGet({ params, env }) {
  const key = params.key;
  const obj = await env.segulap_images.get(key);
  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(obj.body, { headers });
}
