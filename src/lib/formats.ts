// Biblioteca de formatos de carrossel do CAIC.
// O JSON completo será colado depois — por enquanto, esqueleto + tipos
// + uma seed mínima pra que o matching funcione no fluxo.

export type ObjectiveKey =
  | "identificacao"
  | "virar_chave"
  | "valor_percebido"
  | "autoridade"
  | "converter"
  | "educar"
  | "emocional";

export type ProductType =
  | "info_product"
  | "service"
  | "physical_product"
  | "saas"
  | "personal_brand"
  | "any";

export type ToneKey =
  | "proximo"
  | "tecnico"
  | "provocador"
  | "inspirador"
  | "divertido"
  | "elegante"
  | "any";

export type ResourceKey = "depoimento" | "dados" | "comparacao" | "produto" | "virada_crenca";

export interface CarouselFormat {
  id: string; // F1..F8
  name: string;
  anchor_phrase: string;
  short_description: string;
  objetivo_match: Partial<Record<ObjectiveKey, number>>; // 0..3
  tipo_produto_match: Partial<Record<ProductType, number>>; // 0..2
  autoridade_match: number; // 0..2 (quanto o formato projeta autoridade)
  tom_match: Partial<Record<ToneKey, number>>; // 0..1
  recursos_match: Partial<Record<ResourceKey, number>>; // 0..1 (recursos que potencializam)
  slide_count: number;
  complexity: "low" | "medium" | "high";
  image_dependency: "low" | "medium" | "high";
}

// Seed inicial — substituir pelo JSON completo quando ele chegar.
export const FORMATS: CarouselFormat[] = [
  {
    id: "F1",
    name: "Lista anafórica",
    anchor_phrase: "Toda vez que… eu… Toda vez que… eu…",
    short_description: "Repetição rítmica que cria identificação imediata.",
    objetivo_match: { identificacao: 3, emocional: 2, virar_chave: 1 },
    tipo_produto_match: { personal_brand: 2, service: 1, info_product: 1, any: 1 },
    autoridade_match: 1,
    tom_match: { proximo: 1, divertido: 1, inspirador: 1 },
    recursos_match: {},
    slide_count: 7,
    complexity: "low",
    image_dependency: "low",
  },
  {
    id: "F2",
    name: "Pergunta + reframe",
    anchor_phrase: "E se o problema não fosse X, e sim Y?",
    short_description: "Abre com pergunta provocativa e reenquadra a crença.",
    objetivo_match: { virar_chave: 3, educar: 2, autoridade: 1 },
    tipo_produto_match: { info_product: 2, service: 2, saas: 1, any: 1 },
    autoridade_match: 2,
    tom_match: { provocador: 1, tecnico: 1, proximo: 1 },
    recursos_match: { virada_crenca: 1 },
    slide_count: 6,
    complexity: "medium",
    image_dependency: "low",
  },
  {
    id: "F3",
    name: "Não é só X, é Y",
    anchor_phrase: "Não é só [coisa óbvia], é [insight].",
    short_description: "Quebra o senso comum em camadas.",
    objetivo_match: { valor_percebido: 3, virar_chave: 2, autoridade: 1 },
    tipo_produto_match: { service: 2, info_product: 2, physical_product: 1, any: 1 },
    autoridade_match: 2,
    tom_match: { elegante: 1, provocador: 1, tecnico: 1 },
    recursos_match: { produto: 1 },
    slide_count: 6,
    complexity: "medium",
    image_dependency: "medium",
  },
  {
    id: "F4",
    name: "Crença velha × crença nova",
    anchor_phrase: "Antes eu acreditava que… Hoje eu sei que…",
    short_description: "Confronta o antes e o depois de uma crença.",
    objetivo_match: { virar_chave: 3, autoridade: 2, educar: 2 },
    tipo_produto_match: { personal_brand: 2, info_product: 2, service: 1, any: 1 },
    autoridade_match: 2,
    tom_match: { proximo: 1, provocador: 1, inspirador: 1 },
    recursos_match: { virada_crenca: 1 },
    slide_count: 7,
    complexity: "low",
    image_dependency: "low",
  },
  {
    id: "F5",
    name: "Depoimento de jornada",
    anchor_phrase: "Quando comecei… No meio do caminho… Hoje…",
    short_description: "Storytelling em 3 atos com transformação real.",
    objetivo_match: { emocional: 3, identificacao: 2, converter: 2, autoridade: 1 },
    tipo_produto_match: { personal_brand: 2, service: 2, info_product: 2, any: 1 },
    autoridade_match: 2,
    tom_match: { proximo: 1, inspirador: 1 },
    recursos_match: { depoimento: 1 },
    slide_count: 8,
    complexity: "medium",
    image_dependency: "medium",
  },
  {
    id: "F6",
    name: "Split-screen binário",
    anchor_phrase: "De um lado… do outro… qual você escolhe?",
    short_description: "Compara dois caminhos lado a lado e força decisão.",
    objetivo_match: { converter: 3, valor_percebido: 2, virar_chave: 1 },
    tipo_produto_match: { service: 2, saas: 2, physical_product: 2, info_product: 1, any: 1 },
    autoridade_match: 1,
    tom_match: { provocador: 1, tecnico: 1, elegante: 1 },
    recursos_match: { comparacao: 1, produto: 1 },
    slide_count: 6,
    complexity: "medium",
    image_dependency: "high",
  },
  {
    id: "F7",
    name: "Razões enumeradas",
    anchor_phrase: "5 motivos pra você [resultado desejado].",
    short_description: "Lista numerada, didática e escaneável.",
    objetivo_match: { educar: 3, autoridade: 2, valor_percebido: 1 },
    tipo_produto_match: { saas: 2, info_product: 2, service: 1, physical_product: 1, any: 1 },
    autoridade_match: 2,
    tom_match: { tecnico: 1, elegante: 1, proximo: 1 },
    recursos_match: { dados: 1 },
    slide_count: 7,
    complexity: "low",
    image_dependency: "low",
  },
  {
    id: "F8",
    name: "Marca personificada",
    anchor_phrase: "Se a [marca] fosse uma pessoa, ela seria…",
    short_description: "Dá voz e personalidade à marca em primeira pessoa.",
    objetivo_match: { emocional: 3, identificacao: 2, valor_percebido: 1 },
    tipo_produto_match: { personal_brand: 2, physical_product: 2, service: 1, any: 1 },
    autoridade_match: 1,
    tom_match: { divertido: 1, proximo: 1, elegante: 1 },
    recursos_match: {},
    slide_count: 6,
    complexity: "high",
    image_dependency: "high",
  },
];

/* ---------------- Matching ---------------- */

export interface MatchInput {
  objective: ObjectiveKey | string;
  productType?: ProductType | string;
  needsAuthority?: boolean; // derivado do objetivo (autoridade) ou do tom
  tone?: ToneKey | string;
  resources: string[]; // chaves de molho marcadas pelo usuário
}

export interface FormatMatch {
  format: CarouselFormat;
  score: number;
  isWildcard: boolean;
  reason: string; // "Sugerimos porque…"
}

const W = { objective: 3, product: 2, authority: 2, tone: 1, resources: 1 };

const objectiveLabel: Record<string, string> = {
  identificacao: "criar identificação",
  virar_chave: "virar a chave do leitor",
  valor_percebido: "elevar valor percebido",
  autoridade: "construir autoridade",
  converter: "forçar uma escolha",
  educar: "educar",
  emocional: "conectar emocionalmente",
};

export function rankFormats(input: MatchInput): FormatMatch[] {
  const scored = FORMATS.map((f) => {
    let score = 0;

    const objScore = (f.objetivo_match[input.objective as ObjectiveKey] ?? 0) / 3;
    score += objScore * W.objective;

    const prod = (input.productType as ProductType) || "any";
    const prodScore = ((f.tipo_produto_match[prod] ?? f.tipo_produto_match.any ?? 0)) / 2;
    score += prodScore * W.product;

    const authScore = (input.needsAuthority ? f.autoridade_match : f.autoridade_match * 0.5) / 2;
    score += authScore * W.authority;

    const tone = (input.tone as ToneKey) || "any";
    const toneScore = f.tom_match[tone] ?? f.tom_match.any ?? 0;
    score += toneScore * W.tone;

    const resHits = input.resources.reduce(
      (acc, r) => acc + (f.recursos_match[r as ResourceKey] ?? 0),
      0,
    );
    const resScore = Math.min(1, resHits / Math.max(1, input.resources.length || 1));
    score += resScore * W.resources;

    return { format: f, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3);
  const rest = scored.slice(3);
  const wildcard = rest.length
    ? rest[Math.floor(Math.random() * rest.length)]
    : scored[scored.length - 1];

  const buildReason = (f: CarouselFormat): string => {
    const objPart = objectiveLabel[input.objective] ?? "seu objetivo";
    const tonePart = input.tone && input.tone !== "any" ? `seu tom é ${input.tone}` : null;
    const parts = [`seu objetivo é ${objPart}`];
    if (tonePart) parts.push(tonePart);
    return `Sugerimos porque ${parts.join(" e ")}.`;
  };

  const result: FormatMatch[] = top3.map(({ format, score }) => ({
    format,
    score,
    isWildcard: false,
    reason: buildReason(format),
  }));

  result.push({
    format: wildcard.format,
    score: wildcard.score,
    isWildcard: true,
    reason: "Coringa do CAIC — fora do óbvio, mas pode surpreender.",
  });

  return result;
}
