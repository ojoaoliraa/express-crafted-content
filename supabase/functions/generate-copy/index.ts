// Edge Function: generate-copy
// Gera copy de carrossel usando Lovable AI Gateway (Claude Sonnet 4.5).
// - Primeira chamada (sem carousel_id): cria carousel com status='draft' e debita 1 crédito
// - Chamadas seguintes (com carousel_id): regenera, debita 1 crédito, e empilha a copy anterior
//   em previous_versions (máx 3 versões guardadas)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_VERSIONS = 3;

// Mini biblioteca server-side espelhando /src/lib/formats.ts (campos usados no prompt)
const FORMATS_LITE: Record<string, {
  id: string;
  name: string;
  anchor_phrase: string;
  function: string;
  step_formula: string[];
  metadata: { slide_count_min: number; slide_count_max: number; voice_required: string };
}> = {
  F1: { id: "F1", name: "Lista anafórica", anchor_phrase: "Toda vez que… eu… Toda vez que… eu…", function: "Identificação imediata por repetição rítmica de uma estrutura sintática.", step_formula: ["Capa com a frase-âncora", "Slides 2–6: variações da estrutura", "Slide final: virada ou CTA leve"], metadata: { slide_count_min: 6, slide_count_max: 8, voice_required: "primeira pessoa" } },
  F2: { id: "F2", name: "Quebra de expectativa", anchor_phrase: "Você acha que… mas…", function: "Subverter uma crença comum do público.", step_formula: ["Capa com crença comum", "Construir tensão", "Virada", "Nova visão", "CTA reflexivo"], metadata: { slide_count_min: 5, slide_count_max: 7, voice_required: "segunda pessoa" } },
  F3: { id: "F3", name: "Passo a passo", anchor_phrase: "Em N passos:", function: "Ensinar um processo claro e replicável.", step_formula: ["Capa promete o resultado", "Um passo por slide", "Slide final: síntese + convite"], metadata: { slide_count_min: 6, slide_count_max: 9, voice_required: "segunda pessoa" } },
  F4: { id: "F4", name: "Mito vs verdade", anchor_phrase: "Mito: … Verdade: …", function: "Desmontar mitos do nicho com clareza.", step_formula: ["Capa anuncia o mito", "Pares mito/verdade", "Fechamento com convite"], metadata: { slide_count_min: 5, slide_count_max: 8, voice_required: "primeira pessoa" } },
  F5: { id: "F5", name: "Storytelling em 3 atos", anchor_phrase: "Era uma vez…", function: "Conectar via narrativa pessoal com arco emocional.", step_formula: ["Cena inicial", "Conflito", "Virada/insight", "Resolução", "Convite"], metadata: { slide_count_min: 6, slide_count_max: 10, voice_required: "primeira pessoa" } },
  F6: { id: "F6", name: "Antes vs depois", anchor_phrase: "Antes eu… Hoje eu…", function: "Mostrar transformação concreta.", step_formula: ["Capa com contraste", "Cenas de antes", "Cenas de depois", "Síntese", "Convite"], metadata: { slide_count_min: 5, slide_count_max: 8, voice_required: "primeira pessoa" } },
  F7: { id: "F7", name: "Carta aberta", anchor_phrase: "Pra você que…", function: "Acolhimento profundo de uma dor específica.", step_formula: ["Capa com endereçamento direto", "Reconhecimento da dor", "Virada de chave", "Promessa", "Convite emocional"], metadata: { slide_count_min: 6, slide_count_max: 9, voice_required: "segunda pessoa" } },
  F8: { id: "F8", name: "Bastidor revelado", anchor_phrase: "O que ninguém te conta…", function: "Quebrar a quarta parede e mostrar o bastidor.", step_formula: ["Capa promete revelação", "Bastidor cru", "Aprendizado", "Convite"], metadata: { slide_count_min: 5, slide_count_max: 8, voice_required: "primeira pessoa" } },
};

interface Body {
  idea: string;
  objective: string;
  secret_sauce?: string;
  format_id: string;
  carousel_id?: string;
  user_onboarding?: Record<string, string> | null;
}

interface SlideOut {
  index: number;
  text: string;
  image_keywords: string[];
}
interface CopyOut {
  caption: string;
  slides: SlideOut[];
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

    const body = (await req.json()) as Body;
    if (!body?.idea || !body?.objective || !body?.format_id) {
      return json(400, { error: "Payload incompleto: idea, objective, format_id são obrigatórios" });
    }

    const format = FORMATS_LITE[body.format_id];
    if (!format) return json(400, { error: `Formato inexistente: ${body.format_id}` });

    // Créditos
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", user.id)
      .maybeSingle();
    const credits = profile?.credits_remaining ?? 0;
    if (credits < 1) return json(402, { error: "Créditos insuficientes" });

    // Onboarding (usa o que veio no payload OU busca do banco)
    let onboarding = body.user_onboarding ?? null;
    if (!onboarding) {
      const { data } = await supabase
        .from("onboarding_responses")
        .select("product_positioning, target_audience, tone_of_voice, visual_style, additional_notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      onboarding = data ?? {};
    }

    const ob = onboarding ?? {};
    const sauce = body.secret_sauce?.trim() || "(nenhum)";

    const systemPrompt = `Você é o CAIC, um assistente criativo que escreve carrosséis de Instagram seguindo mecânicas testadas.

Contexto do criador:
- Posicionamento: ${ob.product_positioning || "(não informado)"}
- Público-alvo: ${ob.target_audience || "(não informado)"}
- Tom de voz: ${ob.tone_of_voice || "(não informado)"}
- Estilo visual: ${ob.visual_style || "(não informado)"}
- Notas extras: ${ob.additional_notes || "(nenhuma)"}

Tarefa:
Escreva um carrossel de Instagram seguindo o formato '${format.name}' para a ideia: '${body.idea}'.
Objetivo do post: ${body.objective}.
Molho secreto: ${sauce}.

Mecânica do formato:
${format.function}
Frase-âncora: ${format.anchor_phrase}
Fórmula: ${format.step_formula.join(" | ")}
Tom requerido: ${format.metadata.voice_required}

Regras invioláveis:
- Capa abre loop, NÃO entrega resposta
- Frase-âncora aparece em todos os slides aplicáveis
- Acolhimento antes de virar a chave
- Máx 2 frases curtas por slide
- Voz pessoal (1ª ou 2ª pessoa), nunca institucional
- Fechamento com síntese + convite emocional, NÃO "compre agora"
- Slides entre ${format.metadata.slide_count_min} e ${format.metadata.slide_count_max}
- Em cada slide, sugerir 2-3 image_keywords em INGLÊS para busca em banco de imagens

Saída obrigatória: APENAS um objeto JSON válido, sem markdown nem comentários, no formato:
{
  "caption": "legenda do post (até 2200 caracteres)",
  "slides": [
    { "index": 1, "text": "...", "image_keywords": ["...", "..."] }
  ]
}`;

    // Chamada Lovable AI Gateway -> Claude Sonnet 4.5
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere agora o carrossel sobre: "${body.idea}". Retorne SOMENTE o JSON.` },
        ],
      }),
    });

    if (aiRes.status === 429) return json(429, { error: "Limite de requisições da IA. Tente em instantes." });
    if (aiRes.status === 402) return json(402, { error: "Créditos da IA esgotados na workspace." });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      return json(500, { error: "Erro ao gerar copy" });
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content ?? "";

    // Extrair JSON (tolera ```json ... ```)
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    let copy: CopyOut;
    try {
      copy = JSON.parse(cleaned);
      if (!copy.caption || !Array.isArray(copy.slides) || copy.slides.length === 0) {
        throw new Error("Estrutura inválida");
      }
    } catch (e) {
      console.error("JSON parse error", e, raw);
      return json(500, { error: "Resposta da IA não veio em JSON válido" });
    }

    // Debita crédito (mesmo na primeira ou na regeneração)
    await supabase
      .from("profiles")
      .update({ credits_remaining: credits - 1 })
      .eq("id", user.id);
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -1,
      reason: body.carousel_id ? "regenerate_copy" : "generate_copy",
    });

    // Salva / atualiza carousel
    let carouselId = body.carousel_id;
    if (carouselId) {
      // Pega copy atual pra empilhar em previous_versions
      const { data: current } = await supabase
        .from("carousels")
        .select("copy_json, previous_versions")
        .eq("id", carouselId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (current?.copy_json) {
        const prev = Array.isArray(current.previous_versions) ? current.previous_versions : [];
        const next = [
          { saved_at: new Date().toISOString(), copy_json: current.copy_json },
          ...prev,
        ].slice(0, MAX_VERSIONS);
        await supabase
          .from("carousels")
          .update({ copy_json: copy, previous_versions: next })
          .eq("id", carouselId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("carousels")
          .update({ copy_json: copy })
          .eq("id", carouselId)
          .eq("user_id", user.id);
      }
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("carousels")
        .insert({
          user_id: user.id,
          idea: body.idea,
          objective: body.objective,
          format_chosen: body.format_id,
          copy_json: copy,
          status: "draft",
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("Insert carousel error", insErr);
        return json(500, { error: "Erro ao salvar carrossel" });
      }
      carouselId = inserted.id;
    }

    return json(200, { copy, carousel_id: carouselId, credits_remaining: credits - 1 });
  } catch (e) {
    console.error("generate-copy unhandled", e);
    return json(500, { error: "Erro inesperado" });
  }
});
