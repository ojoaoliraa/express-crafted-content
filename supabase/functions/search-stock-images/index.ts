// Edge function: busca fotos no Unsplash + Pexels
import { corsHeaders } from "@supabase/supabase-js/cors";

interface StockImage {
  id: string;
  url: string;       // imagem full
  thumb: string;     // thumbnail pro grid
  source: "unsplash" | "pexels";
  credit: string;    // "Foto por X no Y"
  link: string;      // link pro autor / pro post original
}

const UNSPLASH = Deno.env.get("UNSPLASH_ACCESS_KEY");
const PEXELS = Deno.env.get("PEXELS_API_KEY");

async function searchUnsplash(query: string, perPage = 6): Promise<StockImage[]> {
  if (!UNSPLASH) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=squarish&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH}` },
  });
  if (!res.ok) {
    console.error("Unsplash error", res.status, await res.text());
    return [];
  }
  const json = await res.json();
  return (json.results ?? []).map((p: any) => ({
    id: `u_${p.id}`,
    url: p.urls?.regular,
    thumb: p.urls?.small,
    source: "unsplash" as const,
    credit: `Foto por ${p.user?.name ?? "Unsplash"}`,
    link: p.links?.html ?? "",
  }));
}

async function searchPexels(query: string, perPage = 6): Promise<StockImage[]> {
  if (!PEXELS) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=square`;
  const res = await fetch(url, { headers: { Authorization: PEXELS } });
  if (!res.ok) {
    console.error("Pexels error", res.status, await res.text());
    return [];
  }
  const json = await res.json();
  return (json.photos ?? []).map((p: any) => ({
    id: `p_${p.id}`,
    url: p.src?.large,
    thumb: p.src?.medium,
    source: "pexels" as const,
    credit: `Foto por ${p.photographer ?? "Pexels"}`,
    link: p.url ?? "",
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const query: string = (body?.query ?? "").toString().trim();
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [u, p] = await Promise.all([searchUnsplash(query, 6), searchPexels(query, 6)]);
    // intercala unsplash + pexels pra dar variedade
    const merged: StockImage[] = [];
    const max = Math.max(u.length, p.length);
    for (let i = 0; i < max; i++) {
      if (u[i]) merged.push(u[i]);
      if (p[i]) merged.push(p[i]);
    }

    return new Response(JSON.stringify({ images: merged.slice(0, 12), query }), {
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
