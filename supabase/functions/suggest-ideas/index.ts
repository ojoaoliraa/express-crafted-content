// Edge Function: suggest-ideas
// Gera 5 ideias de carrossel novas via Claude Sonnet 4.5 (Lovable AI Gateway),
// evitando repetir temas dos últimos 5 carrosséis do usuário.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Idea {
  title: string;
  hook: string;
  why_it_works: string;
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) return json(500, { error: "LOVABLE_API_KEY ausente" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Não autorizado" });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "Sessão inválida" });
    const user = userData.user;

    // Onboarding + últimos 5 carrosséis, em paralelo
    const [obRes, carRes] = await Promise.all([
      supabase
        .from("onboarding_responses")
        .select("product_positioning, target_audience, tone_of_voice")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("carousels")
        .select("idea")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const ob = obRes.data ?? {};
    const positioning = ob.product_positioning || "(não informado)";
    const audience = ob.target_audience || "(não informado)";
    const tone = ob.tone_of_voice || "(não informado)";

    const ultimos = (carRes.data ?? [])
      .map((c) => (c.idea || "").trim())
      .filter(Boolean);
    const ultimosTxt = ultimos.length > 0 ? ultimos.map((t) => `- ${t}`).join("\n") : "(nenhum carrossel anterior)";

    const systemPrompt = `Você é o CAIC, um copywriter brasileiro especialista em conteúdo para Instagram. Sugere ideias com personalidade, fugindo do óbvio, evitando jargão de guru.`;

    const userPrompt = `Com base no posicionamento '${positioning}', público '${audience}' e tom '${tone}', sugira 5 ideias de carrossel de Instagram para esta semana. Evite temas próximos de:
${ultimosTxt}

Cada ideia deve:
- Ter um título curto (máx 8 palavras)
- Ter um gancho de uma linha (frase que funciona como capa)
- Ter uma justificativa de uma frase (por que vai funcionar agora)

Saída obrigatória: APENAS um objeto JSON válido, sem markdown nem comentários, no formato exato:
{ "ideas": [ { "title": "...", "hook": "...", "why_it_works": "..." } ] }`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiRes.status === 429) return json(429, { error: "Limite de requisições da IA. Tente em instantes." });
    if (aiRes.status === 402) return json(402, { error: "Créditos da IA esgotados na workspace." });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("suggest-ideas AI error", aiRes.status, txt);
      return json(500, { error: "Erro ao gerar ideias" });
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed: { ideas?: Idea[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("suggest-ideas parse error", e, raw);
      return json(500, { error: "Resposta da IA não veio em JSON válido" });
    }

    const ideas = Array.isArray(parsed.ideas)
      ? parsed.ideas
          .filter((i) => i && typeof i.title === "string" && typeof i.hook === "string" && typeof i.why_it_works === "string")
          .slice(0, 5)
      : [];

    if (ideas.length === 0) return json(500, { error: "Nenhuma ideia válida retornada" });

    return json(200, { ideas });
  } catch (err) {
    console.error("suggest-ideas unhandled", err);
    return json(500, { error: "Erro inesperado" });
  }
});
