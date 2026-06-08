// Biblioteca de mecânicas de carrossel do CAIC.
// Estrutura preenchida com base nos 8 formatos canônicos.
// O conteúdo definitivo virá de /docs/biblioteca-mecanicas.md — ajustar quando chegar.

export type Format = {
  id: string;
  name: string;
  anchor_phrase: string;
  function: string;
  tone: string[];
  triggers: string[];
  step_formula: string[];
  example_other_niche: string;
  contraindications: string[];
  metadata: {
    slide_count_min: number;
    slide_count_max: number;
    complexity: "baixa" | "média" | "alta";
    image_dependency: "baixa" | "média" | "alta" | "muito_alta";
    voice_required: string;
  };
  matching: {
    objetivos: string[];
    tipos_produto: string[];
    autoridade: ("iniciante" | "intermediário" | "avançado")[];
    tom: string[];
    recursos: string[];
  };
};

export const FORMATS: Format[] = [
  {
    id: "F1",
    name: "Lista anafórica",
    anchor_phrase: "Toda vez que… eu… Toda vez que… eu…",
    function:
      "Criar identificação imediata por repetição rítmica de uma estrutura sintática.",
    tone: ["próximo", "divertido", "inspirador"],
    triggers: ["identificação", "pertencimento", "ritmo"],
    step_formula: [
      "Slide 1: capa com a frase-âncora",
      "Slides 2–6: variações da mesma estrutura, uma por slide",
      "Slide final: virada ou CTA leve",
    ],
    example_other_niche:
      "Toda vez que abro o armário e penso 'não tenho roupa', eu na verdade tenho 47 peças que não combinam entre si.",
    contraindications: [
      "Conteúdo muito técnico que precise de explicação linear",
      "Quando não há padrão claro a ser repetido",
    ],
    metadata: {
      slide_count_min: 6,
      slide_count_max: 8,
      complexity: "baixa",
      image_dependency: "baixa",
      voice_required: "primeira pessoa",
    },
    matching: {
      objetivos: ["identificacao", "emocional", "virar_chave"],
      tipos_produto: ["personal_brand", "service", "info_product"],
      autoridade: ["iniciante", "intermediário", "avançado"],
      tom: ["proximo", "divertido", "inspirador"],
      recursos: [],
    },
  },
  {
    id: "F2",
    name: "Pergunta + reframe",
    anchor_phrase: "E se o problema não fosse X, e sim Y?",
    function:
      "Abrir com pergunta provocativa e reenquadrar a crença dominante do leitor.",
    tone: ["provocador", "técnico", "próximo"],
    triggers: ["curiosidade", "dissonância cognitiva", "insight"],
    step_formula: [
      "Slide 1: pergunta-âncora",
      "Slide 2: a crença atual do leitor",
      "Slide 3: por que ela parece verdadeira",
      "Slide 4: o reframe (a nova lente)",
      "Slide 5: consequência prática",
      "Slide 6: CTA",
    ],
    example_other_niche:
      "E se o problema não fosse falta de tempo pra treinar, e sim excesso de planejamento?",
    contraindications: ["Audiência fria sem contexto do tema"],
    metadata: {
      slide_count_min: 5,
      slide_count_max: 7,
      complexity: "média",
      image_dependency: "baixa",
      voice_required: "segunda pessoa",
    },
    matching: {
      objetivos: ["virar_chave", "educar", "autoridade"],
      tipos_produto: ["info_product", "service", "saas"],
      autoridade: ["intermediário", "avançado"],
      tom: ["provocador", "tecnico", "proximo"],
      recursos: ["virada_crenca"],
    },
  },
  {
    id: "F3",
    name: "Não é só X, é Y",
    anchor_phrase: "Não é só [coisa óbvia], é [insight].",
    function: "Quebrar senso comum em camadas e elevar valor percebido.",
    tone: ["elegante", "provocador", "técnico"],
    triggers: ["profundidade", "valor escondido", "reposicionamento"],
    step_formula: [
      "Slide 1: âncora 'Não é só X, é Y'",
      "Slides 2–5: cada slide aprofunda uma camada do Y",
      "Slide 6: síntese + CTA",
    ],
    example_other_niche:
      "Não é só um corte de cabelo. É a primeira coisa que as pessoas veem antes de te ouvirem falar.",
    contraindications: ["Quando o X não é genuinamente óbvio pro público"],
    metadata: {
      slide_count_min: 5,
      slide_count_max: 7,
      complexity: "média",
      image_dependency: "média",
      voice_required: "terceira pessoa ou impessoal",
    },
    matching: {
      objetivos: ["valor_percebido", "virar_chave", "autoridade"],
      tipos_produto: ["service", "info_product", "physical_product"],
      autoridade: ["intermediário", "avançado"],
      tom: ["elegante", "provocador", "tecnico"],
      recursos: ["produto"],
    },
  },
  {
    id: "F4",
    name: "Crença velha × crença nova",
    anchor_phrase: "Antes eu acreditava que… Hoje eu sei que…",
    function:
      "Confrontar antes/depois de uma crença e marcar autoridade pela jornada.",
    tone: ["próximo", "provocador", "inspirador"],
    triggers: ["transformação", "autoridade vivida", "permissão"],
    step_formula: [
      "Slide 1: âncora antes/depois",
      "Slides 2–3: o que eu acreditava e por quê",
      "Slide 4: o evento que virou a chave",
      "Slides 5–6: o que sei hoje + como aplico",
      "Slide 7: convite/CTA",
    ],
    example_other_niche:
      "Antes eu acreditava que vender era empurrar. Hoje sei que vender é traduzir.",
    contraindications: ["Sem virada genuína na sua trajetória"],
    metadata: {
      slide_count_min: 6,
      slide_count_max: 8,
      complexity: "baixa",
      image_dependency: "baixa",
      voice_required: "primeira pessoa",
    },
    matching: {
      objetivos: ["virar_chave", "autoridade", "educar"],
      tipos_produto: ["personal_brand", "info_product", "service"],
      autoridade: ["intermediário", "avançado"],
      tom: ["proximo", "provocador", "inspirador"],
      recursos: ["virada_crenca"],
    },
  },
  {
    id: "F5",
    name: "Depoimento de jornada",
    anchor_phrase: "Quando comecei… No meio do caminho… Hoje…",
    function: "Storytelling em três atos com transformação real e provas.",
    tone: ["próximo", "inspirador"],
    triggers: ["empatia", "prova social", "esperança"],
    step_formula: [
      "Slide 1: âncora dos 3 atos",
      "Slides 2–3: ponto de partida (dor, contexto)",
      "Slides 4–5: meio (obstáculo + decisão)",
      "Slides 6–7: hoje (resultado tangível)",
      "Slide 8: CTA ou lição",
    ],
    example_other_niche:
      "Quando comecei a correr, não passava de 1 km sem parar. Hoje fechei minha primeira meia maratona.",
    contraindications: ["Sem caso real ou prova concreta"],
    metadata: {
      slide_count_min: 7,
      slide_count_max: 9,
      complexity: "média",
      image_dependency: "média",
      voice_required: "primeira pessoa ou terceira (cliente)",
    },
    matching: {
      objetivos: ["emocional", "identificacao", "converter", "autoridade"],
      tipos_produto: ["personal_brand", "service", "info_product"],
      autoridade: ["iniciante", "intermediário", "avançado"],
      tom: ["proximo", "inspirador"],
      recursos: ["depoimento"],
    },
  },
  {
    id: "F6",
    name: "Split-screen binário",
    anchor_phrase: "De um lado… do outro… qual você escolhe?",
    function: "Comparar dois caminhos lado a lado e forçar uma decisão.",
    tone: ["provocador", "técnico", "elegante"],
    triggers: ["contraste", "decisão", "clareza"],
    step_formula: [
      "Slide 1: âncora binária",
      "Slides 2–5: pares de comparação (lado A × lado B)",
      "Slide 6: a escolha + CTA",
    ],
    example_other_niche:
      "De um lado, planilha de Excel improvisada. Do outro, um sistema que fecha o mês em 5 minutos.",
    contraindications: ["Quando os dois lados não são genuinamente comparáveis"],
    metadata: {
      slide_count_min: 5,
      slide_count_max: 7,
      complexity: "média",
      image_dependency: "alta",
      voice_required: "segunda pessoa",
    },
    matching: {
      objetivos: ["converter", "valor_percebido", "virar_chave"],
      tipos_produto: ["service", "saas", "physical_product", "info_product"],
      autoridade: ["intermediário", "avançado"],
      tom: ["provocador", "tecnico", "elegante"],
      recursos: ["comparacao", "produto"],
    },
  },
  {
    id: "F7",
    name: "Razões enumeradas",
    anchor_phrase: "5 motivos pra você [resultado desejado].",
    function: "Lista numerada didática e escaneável que constrói autoridade.",
    tone: ["técnico", "elegante", "próximo"],
    triggers: ["clareza", "didatismo", "completude"],
    step_formula: [
      "Slide 1: âncora numerada",
      "Slides 2–6: um motivo por slide (título curto + 1 parágrafo)",
      "Slide 7: síntese + CTA",
    ],
    example_other_niche:
      "5 motivos pra começar a meditar mesmo achando que você não consegue.",
    contraindications: ["Tema que perde força quando fatiado em itens"],
    metadata: {
      slide_count_min: 6,
      slide_count_max: 8,
      complexity: "baixa",
      image_dependency: "baixa",
      voice_required: "segunda pessoa",
    },
    matching: {
      objetivos: ["educar", "autoridade", "valor_percebido"],
      tipos_produto: ["saas", "info_product", "service", "physical_product"],
      autoridade: ["iniciante", "intermediário", "avançado"],
      tom: ["tecnico", "elegante", "proximo"],
      recursos: ["dados"],
    },
  },
  {
    id: "F8",
    name: "Marca personificada",
    anchor_phrase: "Se a [marca] fosse uma pessoa, ela seria…",
    function: "Dar voz e personalidade à marca em primeira pessoa.",
    tone: ["divertido", "próximo", "elegante"],
    triggers: ["identidade", "afeto", "memorabilidade"],
    step_formula: [
      "Slide 1: âncora personificada",
      "Slides 2–5: traços (como veste, como fala, o que ama, o que recusa)",
      "Slide 6: convite a quem se identifica",
    ],
    example_other_niche:
      "Se a cafeteria fosse uma pessoa, seria aquela amiga que te escuta sem dar conselho.",
    contraindications: ["Marca muito nova sem repertório de personalidade"],
    metadata: {
      slide_count_min: 5,
      slide_count_max: 7,
      complexity: "alta",
      image_dependency: "alta",
      voice_required: "primeira pessoa (marca)",
    },
    matching: {
      objetivos: ["emocional", "identificacao", "valor_percebido"],
      tipos_produto: ["personal_brand", "physical_product", "service"],
      autoridade: ["intermediário", "avançado"],
      tom: ["divertido", "proximo", "elegante"],
      recursos: [],
    },
  },
];

/* ---------------- Matching ---------------- */

const WEIGHTS = {
  objetivo: 3,
  tipo_produto: 2,
  autoridade: 2,
  tom: 1,
  recursos: 1,
};

export interface MatchInput {
  objetivo: string;
  tipo_produto: string;
  autoridade: string;
  tom: string;
  recursos: string[];
}

function scoreFormat(f: Format, input: MatchInput): number {
  let score = 0;

  if (f.matching.objetivos.includes(input.objetivo)) score += WEIGHTS.objetivo;

  if (
    f.matching.tipos_produto.includes(input.tipo_produto) ||
    f.matching.tipos_produto.includes("any")
  ) {
    score += WEIGHTS.tipo_produto;
  }

  if (
    input.autoridade &&
    f.matching.autoridade.includes(input.autoridade as "iniciante" | "intermediário" | "avançado")
  ) {
    score += WEIGHTS.autoridade;
  }

  if (input.tom && f.matching.tom.includes(input.tom)) score += WEIGHTS.tom;

  if (input.recursos && input.recursos.length > 0) {
    const hits = input.recursos.filter((r) => f.matching.recursos.includes(r)).length;
    if (hits > 0) {
      score += WEIGHTS.recursos * (hits / input.recursos.length);
    }
  }

  return score;
}

export function matchFormats(input: MatchInput): { top3: Format[]; wildcard: Format } {
  const scored = FORMATS.map((f) => ({ format: f, score: scoreFormat(f, input) }));
  scored.sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3).map((s) => s.format);
  const rest = scored.slice(3);
  const wildcard =
    rest.length > 0
      ? rest[Math.floor(Math.random() * rest.length)].format
      : scored[scored.length - 1].format;

  return { top3, wildcard };
}

/* ---------------- Backward-compat shims ---------------- */
// Mantém a API antiga usada por src/pages/CriarCarrossel.tsx funcionando.

export type CarouselFormat = Format & {
  short_description: string;
  slide_count: number;
};

export interface FormatMatch {
  format: CarouselFormat;
  score: number;
  isWildcard: boolean;
  reason: string;
}

function toCarouselFormat(f: Format): CarouselFormat {
  return {
    ...f,
    short_description: f.function,
    slide_count: Math.round((f.metadata.slide_count_min + f.metadata.slide_count_max) / 2),
  };
}

export interface RankInput {
  objective: string;
  productType?: string;
  needsAuthority?: boolean;
  tone?: string;
  resources: string[];
}

export function rankFormats(input: RankInput): FormatMatch[] {
  const matchInput: MatchInput = {
    objetivo: input.objective,
    tipo_produto: input.productType ?? "any",
    autoridade: input.needsAuthority ? "avançado" : "intermediário",
    tom: input.tone ?? "any",
    recursos: input.resources ?? [],
  };

  const scored = FORMATS.map((f) => ({ format: f, score: scoreFormat(f, matchInput) }));
  scored.sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3);
  const rest = scored.slice(3);
  const wildcard =
    rest.length > 0 ? rest[Math.floor(Math.random() * rest.length)] : scored[scored.length - 1];

  const reason = (f: Format) =>
    `Sugerimos porque combina com seu objetivo (${input.objective}).`;

  const result: FormatMatch[] = top3.map(({ format, score }) => ({
    format: toCarouselFormat(format),
    score,
    isWildcard: false,
    reason: reason(format),
  }));

  result.push({
    format: toCarouselFormat(wildcard.format),
    score: wildcard.score,
    isWildcard: true,
    reason: "Coringa do CAIC — fora do óbvio, mas pode surpreender.",
  });

  return result;
}
