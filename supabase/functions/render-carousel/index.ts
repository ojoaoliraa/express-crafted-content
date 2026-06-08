// Edge function: render-carousel
// Chamado pelo cliente DEPOIS que ele já fez upload dos PNGs no Storage.
// Apenas valida que o usuário é dono e atualiza a tabela carousels.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  carousel_id: string;
  image_urls: string[];
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Não autorizado" });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "Sessão inválida" });
    const user = userData.user;

    const body = (await req.json()) as Body;
    if (!body?.carousel_id || !Array.isArray(body.image_urls) || body.image_urls.length === 0) {
      return json(400, { error: "carousel_id e image_urls são obrigatórios" });
    }

    // Confirma posse
    const { data: carousel, error: cErr } = await supabase
      .from("carousels")
      .select("id, user_id")
      .eq("id", body.carousel_id)
      .maybeSingle();

    if (cErr || !carousel) return json(404, { error: "Carrossel não encontrado" });
    if (carousel.user_id !== user.id) return json(403, { error: "Carrossel não pertence ao usuário" });

    const { error: updErr } = await supabase
      .from("carousels")
      .update({
        status: "ready",
        images_json: { slides: body.image_urls, rendered_at: new Date().toISOString() },
      })
      .eq("id", body.carousel_id)
      .eq("user_id", user.id);

    if (updErr) {
      console.error("render-carousel update error", updErr);
      return json(500, { error: "Erro ao salvar carrossel" });
    }

    return json(200, { success: true, image_urls: body.image_urls });
  } catch (err) {
    console.error("render-carousel unhandled", err);
    return json(500, { error: "Erro inesperado" });
  }
});
