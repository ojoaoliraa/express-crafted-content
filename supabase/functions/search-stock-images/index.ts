// Edge Function: search-stock-images
// Input:  { keywords: string[], slide_count: number }
// Output: { images: StockImage[] }  — atribuição obrigatória pelos termos de Unsplash + Pexels.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface StockImage {
  id: string;
  url: string;               // imagem grande, pronta pro slide
  thumb: string;             // thumbnail pro grid de seleção
  source: "unsplash" | "pexels";
  photographer: string;
  photographer_url: string;
  source_url: string;        // link pro post original (exigido pelas duas APIs)
  width: number;
  height: number;
}

const UNSPLASH = Deno.env.get("UNSPLASH_ACCESS_KEY");
const PEXELS = Deno.env.get("PEXELS_API_KEY");

// Aceita quadrado (0.95–1.05) e vertical 4:5 (0.78–0.82). Tudo entre 0.78 e 1.05 passa.
function isInstagramFriendly(width: number, height: number): boolean {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= 0.78 && ratio <= 1.05;
}

async function searchUnsplash(query: string, perPage: number): Promise<StockImage[]> {
  if (!UNSPLASH) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query,
  )}&per_page=${perPage}&orientation=squarish&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH}` } });
  if (!res.ok) {
    console.error("Unsplash error", res.status, await res.text());
    return [];
  }
  const json = await res.json();
  return (json.results ?? []).map((p: any): StockImage => ({
    id: `u_${p.id}`,
    url: p.urls?.regular ?? "",
    thumb: p.urls?.small ?? "",
    source: "unsplash",
    photographer: p.user?.name ?? "Unsplash",
    photographer_url: p.user?.links?.html ?? "https://unsplash.com",
    source_url: p.links?.html ?? "",
    width: p.width ?? 0,
    height: p.height ?? 0,
  }));
}

async function searchPexels(query: string, perPage: number): Promise<StockImage[]> {
  if (!PEXELS) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query,
  )}&per_page=${perPage}&orientation=square`;
  const res = await fetch(url, { headers: { Authorization: PEXELS } });
  if (!res.ok) {
    console.error("Pexels error", res.status, await res.text());
    return [];
  }
  const json = await res.json();
  return (json.photos ?? []).map((p: any): StockImage => ({
    id: `p_${p.id}`,
    url: p.src?.large ?? "",
    thumb: p.src?.medium ?? "",
    source: "pexels",
    photographer: p.photographer ?? "Pexels",
    photographer_url: p.photographer_url ?? "https://www.pexels.com",
    source_url: p.url ?? "",
    width: p.width ?? 0,
    height: p.height ?? 0,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawKeywords: unknown = body?.keywords;
    const slideCount = Math.max(1, Math.min(20, Number(body?.slide_count) || 0));

    // Compat: aceita também { query: string } (chamadas legadas)
    let keywords: string[] = Array.isArray(rawKeywords)
      ? rawKeywords.map((k) => String(k).trim()).filter(Boolean)
      : [];
    if (keywords.length === 0 && typeof body?.query === "string" && body.query.trim()) {
      keywords = [body.query.trim()];
    }

    if (keywords.length === 0 || !slideCount) {
      return new Response(
        JSON.stringify({ error: "keywords (string[]) e slide_count (number) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3 por API por keyword, em paralelo
    const tasks = keywords.flatMap((kw) => [searchUnsplash(kw, 3), searchPexels(kw, 3)]);
    const results = await Promise.all(tasks);

    // Mescla intercalando pra dar variedade entre fontes/keywords
    const buckets = results.map((arr) => [...arr]);
    const merged: StockImage[] = [];
    let added = true;
    while (added) {
      added = false;
      for (const b of buckets) {
        const next = b.shift();
        if (next) {
          merged.push(next);
          added = true;
        }
      }
    }

    // Dedup por url + filtra orientação Instagram-friendly
    const seen = new Set<string>();
    const filtered = merged.filter((img) => {
      if (!img.url || seen.has(img.url)) return false;
      if (!isInstagramFriendly(img.width, img.height)) return false;
      seen.add(img.url);
      return true;
    });

    // Devolve pelo menos 12 ou 2x slide_count (o que for maior) pra dar escolha real
    const target = Math.max(12, slideCount * 2);
    const images = filtered.slice(0, target);

    return new Response(JSON.stringify({ images, count: images.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("search-stock-images error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
