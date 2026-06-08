// Edge function: image-proxy
// Resolve CORS de imagens externas (Unsplash/Pexels) para que html-to-image
// consiga capturá-las no canvas sem tainting.
//
// IMPORTANTE: domínio em allowlist para evitar virar proxy aberto.

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "unsplash.com",
  "plus.unsplash.com",
  "images.pexels.com",
  "www.pexels.com",
  "pexels.com",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const reqUrl = new URL(req.url);
    const target = reqUrl.searchParams.get("url");
    if (!target) {
      return new Response(JSON.stringify({ error: "url param obrigatório" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: "url inválida" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "https:") {
      return new Response(JSON.stringify({ error: "apenas https" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return new Response(JSON.stringify({ error: `host não permitido: ${parsed.hostname}` }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(parsed.toString(), {
      headers: { Accept: "image/*" },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `upstream ${upstream.status}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("Content-Type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "resposta não é imagem" }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("image-proxy error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
