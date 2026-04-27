import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  idea: string;
  objective: string;
  sauces: { key: string; detail?: string }[];
  format: {
    id: string;
    name: string;
    anchor_phrase: string;
    short_description: string;
    slide_count: number;
  };
  isRegeneration?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = (await req.json()) as Body;
    if (!body?.idea || !body?.objective || !body?.format) {
      return new Response(JSON.stringify({ error: "Payload incompleto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cobrar crédito apenas em regeneração
    if (body.isRegeneration) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits_remaining")
        .eq("id", user.id)
        .maybeSingle();
      const credits = profile?.credits_remaining ?? 0;
      if (credits < 1) {
        return new Response(JSON.stringify({ error: "Sem créditos suficientes" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase
        .from("profiles")
        .update({ credits_remaining: credits - 1 })
        .eq("id", user.id);
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -1,
        reason: "regenerate_copy",
      });
    }

    // Onboarding do usuário
    const { data: onboarding } = await supabase
      .from("onboarding_responses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sauceText = (body.sauces ?? [])
      .filter((s) => s.key !== "nada")
      .map((s) => `- ${s.key}${s.detail ? `: ${s.detail}` : ""}`)
      .join("\n") || "(nenhum)";

    const systemPrompt = `Você é o CAIC, um copywriter brasileiro especialista em carrosséis para Instagram.
Tom: criativo, próximo, levemente lúdico, profissional. Português do Brasil.
Sua missão: gerar um carrossel ${body.format.slide_count} slides no formato "${body.format.name}".
Frase-âncora típica do formato: "${body.format.anchor_phrase}".
Sobre o formato: ${body.format.short_description}.
Cada slide deve ter título curto (máx 8 palavras) e corpo (máx 35 palavras), exceto o slide 1 (capa) e o último (CTA).
Capa: gancho forte que pare o scroll. CTA final: convite claro à ação.
Sempre devolva também uma legenda final (caption) de até 600 caracteres com 3-5 hashtags relevantes em português.`;

    const userPrompt = `IDEIA DO CARROSSEL:
${body.idea}

OBJETIVO:
${body.objective}

MOLHO SECRETO:
${sauceText}

PERFIL DA MARCA (onboarding):
- Posicionamento: ${onboarding?.product_positioning ?? "não informado"}
- Público-alvo: ${onboarding?.target_audience ?? "não informado"}
- Tom de voz: ${onboarding?.tone_of_voice ?? "não informado"}
- Estilo visual: ${onboarding?.visual_style ?? "não informado"}
- Notas: ${onboarding?.additional_notes ?? "—"}

Gere a copy do carrossel agora.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "deliver_carousel",
              description: "Entrega copy estruturada do carrossel.",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number" },
                        title: { type: "string" },
                        body: { type: "string" },
                        kind: { type: "string", enum: ["cover", "content", "cta"] },
                      },
                      required: ["index", "title", "body", "kind"],
                      additionalProperties: false,
                    },
                  },
                  caption: { type: "string" },
                },
                required: ["slides", "caption"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "deliver_carousel" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tenta de novo em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos do CAIC esgotados. Adicione saldo no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("Sem tool_call:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-copy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
