import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Loader2,
  Check,
  Wand2,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Shuffle,
  Download,
  CalendarClock,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { rankFormats, type FormatMatch, type CarouselFormat } from "@/lib/formats";
import { useAuth } from "@/hooks/useAuth";
import { SlideCard } from "@/components/SlideCard";
import { toPng } from "html-to-image";
import JSZip from "jszip";

const TOTAL_STEPS = 8;

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy`;
const toProxied = (url: string) => `${PROXY_BASE}?url=${encodeURIComponent(url)}`;

const KEY = "caic_wizard_v1";
const loadSaved = (): Record<string, unknown> => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

type ImageMode = "upload" | "stock" | "mix" | null;
interface StockImage {
  id: string;
  url: string;
  thumb: string;
  source: "unsplash" | "pexels";
  credit: string;
  link: string;
}
interface SlideImage {
  url: string;            // displayable (object URL or remote)
  source: "upload" | "stock";
  credit?: string;
  stockMeta?: StockImage;
}

type IdeaMode = "own" | "suggested" | null;

const OBJECTIVES = [
  { value: "identificacao", label: "Gerar identificação com o público" },
  { value: "virar_chave", label: "Virar a chave do leitor (provocar reflexão)" },
  { value: "valor_percebido", label: "Elevar valor percebido do meu produto/serviço" },
  { value: "autoridade", label: "Construir autoridade" },
  { value: "converter", label: "Forçar uma escolha / converter" },
  { value: "educar", label: "Educar / argumentar" },
  { value: "emocional", label: "Conectar emocionalmente com a marca" },
];

type SauceKey =
  | "depoimento"
  | "virada_crenca"
  | "dados"
  | "comparacao"
  | "produto"
  | "nada";

const SAUCES: { value: SauceKey; label: string; followupLabel?: string }[] = [
  { value: "depoimento", label: "Tenho um depoimento ou case real", followupLabel: "Conta pro CAIC qual é o depoimento ou case" },
  { value: "virada_crenca", label: "Tenho uma virada de crença minha pra contar", followupLabel: "Conta pro CAIC qual é a virada de crença" },
  { value: "dados", label: "Tenho dados ou números fortes", followupLabel: "Conta pro CAIC quais são os dados ou números" },
  { value: "comparacao", label: "É comparação com concorrente / outro caminho", followupLabel: "Conta pro CAIC qual é a comparação" },
  { value: "produto", label: "É sobre um produto específico que quero destacar", followupLabel: "Conta pro CAIC qual produto e o que destacar" },
  { value: "nada", label: "Não tenho nada extra (vai só na ideia mesmo)" },
];

const CriarCarrossel = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [ideaMode, setIdeaMode] = useState<IdeaMode>(null);
  const [ideaText, setIdeaText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // Step 2
  const [objective, setObjective] = useState<string>("");

  // Step 3
  const [sauces, setSauces] = useState<Record<SauceKey, boolean>>({
    depoimento: false,
    virada_crenca: false,
    dados: false,
    comparacao: false,
    produto: false,
    nada: false,
  });
  const [sauceDetails, setSauceDetails] = useState<Record<string, string>>({});

  // Step 4 — formatos sugeridos
  const [matches, setMatches] = useState<FormatMatch[]>([]);
  const [chosenFormat, setChosenFormat] = useState<CarouselFormat | null>(null);

  // Step 5 — copy
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<
    { index: number; text: string; kind: string }[]
  >([]);
  const [caption, setCaption] = useState("");
  const [carouselId, setCarouselId] = useState<string | null>(null);
  const [copyEmpty, setCopyEmpty] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Debug: log toda mudança de step
  useEffect(() => {
    console.log("[CAIC] step changed to:", step, "state:", {
      objective,
      format_id: chosenFormat?.id,
      carousel_id: carouselId,
      slides_count: slides.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Step 6 — Imagens
  const [imageMode, setImageMode] = useState<ImageMode>(null);
  const [slideImages, setSlideImages] = useState<Record<number, SlideImage>>({});
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockQuery, setStockQuery] = useState("");
  const [pickingForSlide, setPickingForSlide] = useState<number | null>(null);

  // Step 7 — Render
  const renderRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [rendering, setRendering] = useState(false);
  const [renderedPreviews, setRenderedPreviews] = useState<{ index: number; dataUrl: string }[]>([]);
  const [previewSlide, setPreviewSlide] = useState(0);

  // Step 8 — Final
  const [renderedBlobs, setRenderedBlobs] = useState<{ index: number; blob: Blob }[]>([]);
  const [savedCarouselId, setSavedCarouselId] = useState<string | null>(null);

  // Carrega créditos atuais quando entra na etapa 5
  useEffect(() => {
    if (step !== 5 || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("credits_remaining")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data) setCredits(data.credits_remaining);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, user, generating]);

  // Persistência: seed inicial a partir do sessionStorage
  useEffect(() => {
    const s = loadSaved();
    if (!s || Object.keys(s).length === 0) return;
    if (typeof s.step === "number") setStep(s.step);
    if (s.ideaMode !== undefined) setIdeaMode(s.ideaMode as IdeaMode);
    if (typeof s.ideaText === "string") setIdeaText(s.ideaText);
    if (typeof s.objective === "string") setObjective(s.objective);
    if (s.sauces) setSauces(s.sauces as Record<SauceKey, boolean>);
    if (s.sauceDetails) setSauceDetails(s.sauceDetails as Record<string, string>);
    if (s.chosenFormat) setChosenFormat(s.chosenFormat as CarouselFormat);
    if (Array.isArray(s.slides)) setSlides(s.slides as { index: number; text: string; kind: string }[]);
    if (typeof s.caption === "string") setCaption(s.caption);
    if (typeof s.carouselId === "string") setCarouselId(s.carouselId);
    if (s.imageMode !== undefined) setImageMode(s.imageMode as ImageMode);
    if (s.slideImages) setSlideImages(s.slideImages as Record<number, SlideImage>);
    if (typeof s.credits === "number") setCredits(s.credits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência: salva mudanças relevantes (sem blobs/uploads/previews)
  useEffect(() => {
    try {
      const serializableImages: Record<number, SlideImage> = {};
      for (const [k, v] of Object.entries(slideImages)) {
        if (v.source === "stock") serializableImages[Number(k)] = v;
      }
      sessionStorage.setItem(
        KEY,
        JSON.stringify({
          step,
          ideaMode,
          ideaText,
          objective,
          sauces,
          sauceDetails,
          chosenFormat,
          slides,
          caption,
          carouselId,
          imageMode,
          slideImages: serializableImages,
          credits,
        }),
      );
    } catch {
      /* ignore quota errors */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ideaMode, ideaText, objective, sauces, sauceDetails, chosenFormat, slides, caption, carouselId, imageMode, slideImages, credits]);

  const handleReset = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    setStep(1);
    setIdeaMode(null);
    setIdeaText("");
    setSelectedSuggestion(null);
    setSuggestions([]);
    setObjective("");
    setSauces({ depoimento: false, virada_crenca: false, dados: false, comparacao: false, produto: false, nada: false });
    setSauceDetails({});
    setChosenFormat(null);
    setMatches([]);
    setSlides([]);
    setCaption("");
    setCarouselId(null);
    setCopyEmpty(false);
    setImageMode(null);
    setSlideImages({});
    setStockImages([]);
    setRenderedPreviews([]);
    setRenderedBlobs([]);
  };


  const progress = (step / TOTAL_STEPS) * 100;

  const finalIdea = ideaMode === "own" ? ideaText.trim() : selectedSuggestion ?? "";

  const canAdvanceFromStep1 = !!finalIdea;
  const canAdvanceFromStep2 = !!objective;

  const handleSuggest = async () => {
    setIdeaMode("suggested");
    setLoadingSuggestions(true);
    setSelectedSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-ideas", {});
      if (error) throw error;
      const rawIdeas: unknown[] = data?.ideas ?? [];
      const ideas: string[] = rawIdeas
        .map((i) => {
          if (typeof i === "string") return i;
          if (i && typeof i === "object") {
            const obj = i as { title?: unknown; hook?: unknown };
            if (typeof obj.title === "string") return obj.title;
            if (typeof obj.hook === "string") return obj.hook;
          }
          return "";
        })
        .filter(Boolean);
      setSuggestions(ideas);
    } catch (err) {
      // Fallback local enquanto o endpoint não existe
      console.warn("suggest-ideas indisponível, usando fallback", err);
      setSuggestions([
        "3 erros que travam criadores de conteúdo iniciantes",
        "O que ninguém te conta sobre construir autoridade no Instagram",
        "Como transformar um depoimento de cliente em prova social poderosa",
        "A virada de chave que mudou meu jeito de vender",
        "Por que postar todo dia não significa crescer",
      ]);
      toast({
        title: "Usando sugestões de exemplo",
        description: "O CAIC ainda não personalizou — em breve as sugestões saem do seu perfil.",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleSauce = (key: SauceKey) => {
    setSauces((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Se marcar "nada", limpa as outras; se marcar outra, desmarca "nada"
      if (key === "nada" && next.nada) {
        (Object.keys(next) as SauceKey[]).forEach((k) => {
          if (k !== "nada") next[k] = false;
        });
      } else if (key !== "nada" && next[key]) {
        next.nada = false;
      }
      return next;
    });
  };

  const handleAdvance = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/app");
    } else {
      setStep(step - 1);
    }
  };

  const handleAskFormats = () => {
    const activeSauces = (Object.keys(sauces) as SauceKey[]).filter(
      (k) => sauces[k] && k !== "nada",
    );
    const ranked = rankFormats({
      objective,
      productType: "any",
      needsAuthority: objective === "autoridade" || objective === "valor_percebido",
      tone: "any",
      resources: activeSauces,
    });
    setMatches(ranked);
    setChosenFormat(null);
    setStep(4);
  };

  // Mapeia a estrutura crua do edge { index, text, image_keywords }
  // para { index, text, kind } usada pelo wizard.
  const mapSlidesFromCopy = (raw: unknown): { index: number; text: string; kind: string }[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map((s, i, arr) => {
      const obj = (s ?? {}) as { index?: unknown; text?: unknown; title?: unknown; body?: unknown };
      const text =
        typeof obj.text === "string"
          ? obj.text
          : typeof obj.title === "string"
            ? obj.title
            : typeof obj.body === "string"
              ? obj.body
              : "";
      return {
        index: typeof obj.index === "number" ? obj.index : i + 1,
        text,
        kind: i === 0 ? "cover" : i === arr.length - 1 ? "cta" : "content",
      };
    });
  };

  const applyGeneratedCopy = (data: unknown) => {
    console.log("[CAIC] generate-copy returned:", JSON.stringify(data).slice(0, 500));
    const payload = (data ?? {}) as {
      copy?: { caption?: unknown; slides?: unknown };
      carousel_id?: unknown;
      credits_remaining?: unknown;
    };
    const copy = payload.copy ?? {};
    const mapped = mapSlidesFromCopy((copy as { slides?: unknown }).slides);
    setSlides(mapped);
    setCaption(typeof (copy as { caption?: unknown }).caption === "string" ? (copy as { caption: string }).caption : "");
    if (typeof payload.carousel_id === "string") setCarouselId(payload.carousel_id);
    if (typeof payload.credits_remaining === "number") setCredits(payload.credits_remaining);
    setCopyEmpty(mapped.length === 0);
  };

  const generateCopy = async (isRegeneration = false) => {
    if (!chosenFormat) return;
    setGenerating(true);
    setCopyEmpty(false);
    try {
      const sauceList = (Object.keys(sauces) as SauceKey[])
        .filter((k) => sauces[k] && k !== "nada")
        .map((k) => `${k}${sauceDetails[k] ? `: ${sauceDetails[k]}` : ""}`)
        .join(" | ");

      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          idea: finalIdea,
          objective,
          secret_sauce: sauceList || undefined,
          format_id: chosenFormat.id,
          carousel_id: isRegeneration ? carouselId : undefined,
        },
      });

      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      applyGeneratedCopy(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Deu ruim na geração",
        description: err?.message ?? "Não consegui gerar a copy agora.",
        variant: "destructive",
      });
      setCopyEmpty(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleChooseFormat = async (f: CarouselFormat) => {
    setChosenFormat(f);
    setSlides([]);
    setCaption("");
    setCarouselId(null);
    setCopyEmpty(false);
    setStep(5);
    setTimeout(() => generateCopyFor(f, false), 0);
  };

  // Wrapper que recebe o formato direto (evita race do setState)
  const generateCopyFor = async (format: CarouselFormat, isRegeneration: boolean) => {
    setGenerating(true);
    setCopyEmpty(false);
    try {
      const sauceList = (Object.keys(sauces) as SauceKey[])
        .filter((k) => sauces[k] && k !== "nada")
        .map((k) => `${k}${sauceDetails[k] ? `: ${sauceDetails[k]}` : ""}`)
        .join(" | ");

      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          idea: finalIdea,
          objective,
          secret_sauce: sauceList || undefined,
          format_id: format.id,
          carousel_id: isRegeneration ? carouselId : undefined,
        },
      });

      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      applyGeneratedCopy(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Deu ruim na geração",
        description: err?.message ?? "Tenta de novo em instantes.",
        variant: "destructive",
      });
      setCopyEmpty(true);
    } finally {
      setGenerating(false);
    }
  };


  const handleRegenerate = () => setConfirmRegenerate(true);
  const confirmAndRegenerate = async () => {
    setConfirmRegenerate(false);
    if (chosenFormat) await generateCopyFor(chosenFormat, true);
  };

  const handleApprove = () => {
    // Vai pra etapa de imagens
    setImageMode(null);
    setStep(6);
  };

  // ----------- Etapa 6: imagens -----------

  const buildKeywordsFromCopy = () => {
    const text = [finalIdea, ...slides.map((s) => s.text)].join(" ");
    // pega palavras-chave grosseiras
    const stop = new Set([
      "de","da","do","das","dos","e","o","a","os","as","em","um","uma","no","na","pra","para","por","com","que","se","sobre","mais","seu","sua","ser","tem","tô","você","voce","caic",
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-záéíóúâêôãõç\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stop.has(w));
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w)
      .join(" ");
  };

  const fetchStock = async (override?: string) => {
    const query = (override ?? stockQuery ?? buildKeywordsFromCopy()).trim() || "aesthetic minimal";
    setStockQuery(query);
    setLoadingStock(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-stock-images", {
        body: { query, keywords: [query], slide_count: slides.length || 8 },
      });
      if (error) throw error;
      const imgs: StockImage[] = data?.images ?? [];
      setStockImages(imgs);
      // Se modo stock e nenhum slide tem imagem ainda, distribui automaticamente.
      if (imageMode === "stock" && imgs.length && Object.keys(slideImages).length === 0) {
        distributeStockImages(imgs);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Não rolou buscar fotos",
        description: "Tenta de novo ou sobe as suas.",
        variant: "destructive",
      });
    } finally {
      setLoadingStock(false);
    }
  };

  const assignUpload = (index: number, file: File) => {
    const url = URL.createObjectURL(file);
    setSlideImages((prev) => ({
      ...prev,
      [index]: { url, source: "upload" },
    }));
  };

  const assignStock = (index: number, img: StockImage) => {
    setSlideImages((prev) => ({
      ...prev,
      [index]: { url: toProxied(img.url), source: "stock", credit: img.credit, stockMeta: img },
    }));
    setPickingForSlide(null);
  };

  /**
   * Distribui imagens stock pelos slides com rotação:
   * - garante 1 imagem única por slide quando há imagens suficientes
   * - se houver menos imagens que slides, repete em ciclo (img1, img2, img1, img2...)
   * - só preenche slots vazios (não sobrescreve escolha manual)
   */
  const distributeStockImages = (imgs: StockImage[]) => {
    if (!imgs.length || !slides.length) return;
    setSlideImages((prev) => {
      const next = { ...prev };
      // pega imagens ainda não usadas primeiro pra evitar repetição
      const usedUrls = new Set(
        Object.values(next)
          .filter((v) => v?.source === "stock" && v.stockMeta?.url)
          .map((v) => v.stockMeta!.url),
      );
      const pool = imgs.filter((i) => !usedUrls.has(i.url));
      const ring = pool.length > 0 ? pool : imgs;
      let ringIdx = 0;
      for (const s of slides) {
        if (next[s.index]) continue;
        const img = ring[ringIdx % ring.length];
        ringIdx += 1;
        next[s.index] = {
          url: toProxied(img.url),
          source: "stock",
          credit: img.credit,
          stockMeta: img,
        };
      }
      return next;
    });
    setPickingForSlide(null);
  };

  const removeImage = (index: number) => {
    setSlideImages((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const allSlidesHaveImages = slides.length > 0 && slides.every((s) => slideImages[s.index]);

  // ----------- Etapa 7: render -----------

  const handleRender = async () => {
    setStep(7);
    setRendering(true);
    setRenderedPreviews([]);
    setRenderedBlobs([]);
    try {
      // espera todas as imagens decodificarem antes de renderizar
      const imgs = Array.from(
        document.querySelectorAll<HTMLImageElement>('[data-render-target="true"] img'),
      );
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : img.decode().catch(() => {}),
        ),
      );
      const previews: { index: number; dataUrl: string }[] = [];
      const blobs: { index: number; blob: Blob }[] = [];
      for (const s of slides) {
        const node = renderRefs.current[s.index];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          pixelRatio: 1,
          cacheBust: false,
          backgroundColor: "#0a0a0a",
        });
        previews.push({ index: s.index, dataUrl });
        const blob = await (await fetch(dataUrl)).blob();
        blobs.push({ index: s.index, blob });
      }
      setRenderedPreviews(previews);
      setRenderedBlobs(blobs);
      setPreviewSlide(0);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao montar carrossel",
        description: err?.message ?? "Tenta de novo.",
        variant: "destructive",
      });
      setStep(6);
    } finally {
      setRendering(false);
    }
  };

  const handleAdjust = async () => {
    if ((credits ?? 0) < 1) {
      toast({ title: "Sem créditos", description: "Recarrega pra ajustar.", variant: "destructive" });
      return;
    }
    // volta pra etapa 6 pra trocar imagens
    setStep(6);
  };

  // ----------- Etapa 8: salvar + download -----------

  const handleConfirmFinal = async () => {
    if (!user) return;
    try {
      // Upload pro storage privado
      const uploads: { index: number; path: string }[] = [];
      const carouselId = crypto.randomUUID();
      for (const r of renderedBlobs) {
        const path = `${user.id}/${carouselId}/slide-${r.index}.png`;
        const { error } = await supabase.storage
          .from("carousel-images")
          .upload(path, r.blob, { contentType: "image/png", upsert: true });
        if (error) throw error;
        uploads.push({ index: r.index, path });
      }

      const { error: insErr } = await supabase.from("carousels").insert({
        id: carouselId,
        user_id: user.id,
        idea: finalIdea,
        objective,
        format_chosen: chosenFormat?.id ?? null,
        copy_json: { slides, caption } as any,
        images_json: { items: uploads } as any,
        status: "approved",
      });
      if (insErr) throw insErr;
      setSavedCarouselId(carouselId);
      setStep(8);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Não consegui salvar",
        description: err?.message ?? "Tenta de novo.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      const folder = zip.folder("carrossel-caic")!;
      for (const r of renderedBlobs.sort((a, b) => a.index - b.index)) {
        folder.file(`slide-${String(r.index).padStart(2, "0")}.png`, r.blob);
      }
      folder.file("legenda.txt", caption || "");
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carrossel-caic-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Não consegui gerar o zip",
        description: err?.message ?? "Tenta de novo.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Etapa {step} de {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
          {step === 1 && (
            <Step1
              ideaMode={ideaMode}
              setIdeaMode={setIdeaMode}
              ideaText={ideaText}
              setIdeaText={setIdeaText}
              suggestions={suggestions}
              loadingSuggestions={loadingSuggestions}
              selectedSuggestion={selectedSuggestion}
              setSelectedSuggestion={setSelectedSuggestion}
              onAskSuggest={handleSuggest}
            />
          )}

          {step === 2 && (
            <Step2 objective={objective} setObjective={setObjective} />
          )}

          {step === 3 && (
            <Step3
              sauces={sauces}
              toggleSauce={toggleSauce}
              sauceDetails={sauceDetails}
              setSauceDetails={setSauceDetails}
            />
          )}

          {step === 4 && (
            <Step4 matches={matches} onChoose={handleChooseFormat} />
          )}

          {step === 5 && (
            <Step5
              format={chosenFormat}
              generating={generating}
              slides={slides}
              setSlides={setSlides}
              caption={caption}
              setCaption={setCaption}
              credits={credits}
              copyEmpty={copyEmpty}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
            />
          )}

          {step === 6 && (
            <Step6
              slides={slides}
              imageMode={imageMode}
              setImageMode={setImageMode}
              slideImages={slideImages}
              assignUpload={assignUpload}
              assignStock={assignStock}
              removeImage={removeImage}
              stockImages={stockImages}
              loadingStock={loadingStock}
              stockQuery={stockQuery}
              setStockQuery={setStockQuery}
              fetchStock={fetchStock}
              pickingForSlide={pickingForSlide}
              setPickingForSlide={setPickingForSlide}
              distributeStockImages={distributeStockImages}
            />
          )}

          {step === 7 && (
            <Step7
              rendering={rendering}
              renderedPreviews={renderedPreviews}
              previewSlide={previewSlide}
              setPreviewSlide={setPreviewSlide}
              credits={credits}
              onConfirm={handleConfirmFinal}
              onAdjust={handleAdjust}
            />
          )}

          {step === 8 && (
            <Step8
              onDownload={handleDownloadZip}
              onBack={() => navigate("/app")}
            />
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between gap-3">
          {step !== 8 && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleBack} disabled={generating || rendering}>
                <ArrowLeft className="h-4 w-4" />
                {step === 1 ? "Cancelar" : "Voltar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={generating || rendering}
                className="text-xs text-muted-foreground"
              >
                Reset
              </Button>
            </div>
          )}
          {step === 8 && <div />}

          {step === 1 && (
            <Button onClick={handleAdvance} disabled={!canAdvanceFromStep1} size="lg">
              Avançar <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleAdvance} disabled={!canAdvanceFromStep2} size="lg">
              Avançar <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleAskFormats} size="lg">
              Pedir os formatos pro CAIC <Sparkles className="h-4 w-4" />
            </Button>
          )}
          {step === 6 && (
            <Button onClick={handleRender} disabled={!allSlidesHaveImages} size="lg">
              Montar carrossel <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Render targets escondidos (1080x1080) — usados pra gerar PNGs */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none" aria-hidden>
        {step >= 6 &&
          slides.map((s) => (
            <div key={`render-${s.index}`} data-render-target="true">
              <SlideCard
                ref={(el) => (renderRefs.current[s.index] = el)}
                index={s.index}
                total={slides.length}
                text={s.text}
                kind={s.kind}
                imageUrl={slideImages[s.index]?.url}
                variant="render"
              />
            </div>
          ))}
      </div>

      <AlertDialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerar gasta 1 crédito</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer pedir uma nova versão? O CAIC vai descartar a copy atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndRegenerate}>
              Sim, regenerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

/* ---------------- Step 1 ---------------- */

interface Step1Props {
  ideaMode: IdeaMode;
  setIdeaMode: (m: IdeaMode) => void;
  ideaText: string;
  setIdeaText: (s: string) => void;
  suggestions: string[];
  loadingSuggestions: boolean;
  selectedSuggestion: string | null;
  setSelectedSuggestion: (s: string | null) => void;
  onAskSuggest: () => void;
}

const Step1 = ({
  ideaMode,
  setIdeaMode,
  ideaText,
  setIdeaText,
  suggestions,
  loadingSuggestions,
  selectedSuggestion,
  setSelectedSuggestion,
  onAskSuggest,
}: Step1Props) => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm text-primary font-medium">CAIC pergunta</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight">
        Qual a ideia do carrossel hoje?
      </h1>
    </header>

    {ideaMode === null && (
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setIdeaMode("own")}
          className="group text-left rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-smooth"
        >
          <Lightbulb className="h-5 w-5 text-primary mb-3" />
          <p className="font-display text-lg leading-snug mb-1">Já tenho uma ideia</p>
          <p className="text-sm text-muted-foreground">Vou contar pro CAIC.</p>
        </button>
        <button
          type="button"
          onClick={onAskSuggest}
          className="group text-left rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-smooth"
        >
          <Sparkles className="h-5 w-5 text-primary mb-3" />
          <p className="font-display text-lg leading-snug mb-1">Não tenho ideia hoje</p>
          <p className="text-sm text-muted-foreground">Me sugere uma.</p>
        </button>
      </div>
    )}

    {ideaMode === "own" && (
      <div className="space-y-3">
        <Label htmlFor="idea">Conta a ideia em algumas linhas</Label>
        <Textarea
          id="idea"
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder="Ex: quero falar sobre os 3 erros mais comuns que travam criadores iniciantes…"
          className="min-h-32"
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setIdeaMode(null);
            setIdeaText("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
        >
          ← trocar de opção
        </button>
      </div>
    )}

    {ideaMode === "suggested" && (
      <div className="space-y-3">
        {loadingSuggestions ? (
          <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">CAIC pensando em ideias pra você…</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Escolhe uma:</p>
            <div className="grid gap-2">
              {suggestions.map((s, i) => {
                const selected = selectedSuggestion === s;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSuggestion(s)}
                    className={cn(
                      "text-left rounded-xl border p-4 transition-smooth flex items-start gap-3",
                      selected
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                        selected ? "bg-primary border-primary" : "border-border",
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm leading-snug">{s}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setIdeaMode(null);
                setSelectedSuggestion(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              ← trocar de opção
            </button>
          </>
        )}
      </div>
    )}
  </div>
);

/* ---------------- Step 2 ---------------- */

const Step2 = ({
  objective,
  setObjective,
}: {
  objective: string;
  setObjective: (s: string) => void;
}) => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm text-primary font-medium">CAIC pergunta</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight">
        Qual o objetivo desse carrossel?
      </h1>
    </header>

    <RadioGroup value={objective} onValueChange={setObjective} className="gap-2">
      {OBJECTIVES.map((opt) => {
        const selected = objective === opt.value;
        return (
          <Label
            key={opt.value}
            htmlFor={opt.value}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-smooth",
              selected
                ? "border-primary bg-primary/5 shadow-soft"
                : "border-border bg-card hover:border-primary/50",
            )}
          >
            <RadioGroupItem value={opt.value} id={opt.value} />
            <span className="text-sm font-normal leading-snug">{opt.label}</span>
          </Label>
        );
      })}
    </RadioGroup>
  </div>
);

/* ---------------- Step 3 ---------------- */

const Step3 = ({
  sauces,
  toggleSauce,
  sauceDetails,
  setSauceDetails,
}: {
  sauces: Record<SauceKey, boolean>;
  toggleSauce: (k: SauceKey) => void;
  sauceDetails: Record<string, string>;
  setSauceDetails: (d: Record<string, string>) => void;
}) => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm text-primary font-medium">CAIC pergunta</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight">
        Tem algum molho secreto pra esse carrossel?
      </h1>
      <p className="text-sm text-muted-foreground">
        Opcional. Pode marcar mais de uma.
      </p>
    </header>

    <div className="space-y-2">
      {SAUCES.map((s) => {
        const checked = sauces[s.value];
        return (
          <div key={s.value} className="space-y-2">
            <Label
              htmlFor={`sauce-${s.value}`}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-smooth",
                checked
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              <Checkbox
                id={`sauce-${s.value}`}
                checked={checked}
                onCheckedChange={() => toggleSauce(s.value)}
                className="mt-0.5"
              />
              <span className="text-sm font-normal leading-snug">{s.label}</span>
            </Label>

            {checked && s.followupLabel && (
              <div className="pl-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <Textarea
                  value={sauceDetails[s.value] ?? ""}
                  onChange={(e) =>
                    setSauceDetails({ ...sauceDetails, [s.value]: e.target.value })
                  }
                  placeholder={s.followupLabel}
                  className="min-h-20 text-sm"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default CriarCarrossel;

/* ---------------- Step 4 — Formatos ---------------- */

const Step4 = ({
  matches,
  onChoose,
}: {
  matches: FormatMatch[];
  onChoose: (f: CarouselFormat) => void;
}) => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm text-primary font-medium">CAIC sugere</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight">
        Os 3 formatos com mais fit + 1 coringa
      </h1>
      <p className="text-sm text-muted-foreground">
        Escolhe o que mais te chama. Dá pra trocar se não rolar.
      </p>
    </header>

    <div className="grid gap-3 sm:grid-cols-2">
      {matches.map((m) => (
        <div
          key={m.format.id}
          className={cn(
            "rounded-xl border p-5 bg-card flex flex-col gap-3 transition-smooth hover:shadow-soft",
            m.isWildcard ? "border-accent-foreground/30" : "border-border",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg leading-tight">{m.format.name}</h3>
            {m.isWildcard && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground border-0">
                Coringa
              </Badge>
            )}
          </div>
          <p className="text-sm italic text-foreground/80 border-l-2 border-primary/40 pl-3">
            "{m.format.anchor_phrase}"
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{m.reason}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{m.format.slide_count} slides</span>
            <span>•</span>
            <span className="capitalize">{m.format.complexity}</span>
          </div>
          <Button onClick={() => onChoose(m.format)} className="mt-1" size="sm">
            Escolher este
          </Button>
        </div>
      ))}
    </div>
  </div>
);

/* ---------------- Step 5 — Geração de copy ---------------- */

interface SlideRow {
  index: number;
  text: string;
  kind: string;
}

const Step5 = ({
  format,
  generating,
  slides,
  setSlides,
  caption,
  setCaption,
  credits,
  copyEmpty,
  onApprove,
  onRegenerate,
}: {
  format: CarouselFormat | null;
  generating: boolean;
  slides: SlideRow[];
  setSlides: (s: SlideRow[]) => void;
  caption: string;
  setCaption: (s: string) => void;
  credits: number | null;
  copyEmpty: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
}) => {
  const updateSlide = (index: number, patch: Partial<SlideRow>) => {
    setSlides(slides.map((s) => (s.index === index ? { ...s, ...patch } : s)));
  };

  if (generating) {
    return (
      <div className="text-center py-16 space-y-5">
        <div className="mx-auto relative h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wand2 className="h-7 w-7 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="font-display text-2xl">Boa escolha.</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Tô gerando uma copy que gera conexão… isso leva uns 20 segundos.
        </p>
      </div>
    );
  }

  if (!slides.length) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground text-sm">
          {copyEmpty
            ? "Não consegui gerar os slides — regenerar?"
            : "Aguardando o CAIC…"}
        </p>
        {copyEmpty && (
          <Button onClick={onRegenerate} variant="outline">
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm text-primary font-medium">CAIC entregou</p>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight">
            Sua copy no formato {format?.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Edita à vontade — clica no texto pra ajustar.
          </p>
        </div>
        {credits !== null && (
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            {credits} {credits === 1 ? "crédito" : "créditos"}
          </Badge>
        )}
      </header>

      <div className="space-y-3">
        {slides.map((s) => (
          <div
            key={s.index}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">Slide {s.index}</span>
              <span>•</span>
              <span className="capitalize">
                {s.kind === "cover" ? "capa" : s.kind === "cta" ? "CTA" : "conteúdo"}
              </span>
            </div>
            <Textarea
              value={s.text}
              onChange={(e) => updateSlide(s.index, { text: e.target.value })}
              className="min-h-24 text-base font-display"
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="text-xs text-muted-foreground font-medium">Legenda</div>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-24 text-sm"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <Button variant="outline" onClick={onRegenerate} disabled={(credits ?? 0) < 1}>
          <RefreshCw className="h-4 w-4" />
          Regenerar (1 crédito)
        </Button>
        <Button onClick={onApprove} size="lg">
          Está bom, seguir <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/* ---------------- Step 6 — Imagens ---------------- */

interface Step6Props {
  slides: { index: number; text: string; kind: string }[];
  imageMode: ImageMode;
  setImageMode: (m: ImageMode) => void;
  slideImages: Record<number, SlideImage>;
  assignUpload: (index: number, file: File) => void;
  assignStock: (index: number, img: StockImage) => void;
  removeImage: (index: number) => void;
  stockImages: StockImage[];
  loadingStock: boolean;
  stockQuery: string;
  setStockQuery: (s: string) => void;
  fetchStock: (override?: string) => void;
  pickingForSlide: number | null;
  setPickingForSlide: (n: number | null) => void;
  distributeStockImages: (imgs: StockImage[]) => void;
}

const Step6 = ({
  slides,
  imageMode,
  setImageMode,
  slideImages,
  assignUpload,
  assignStock,
  removeImage,
  stockImages,
  loadingStock,
  stockQuery,
  setStockQuery,
  fetchStock,
  pickingForSlide,
  setPickingForSlide,
  distributeStockImages,
}: Step6Props) => {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-primary font-medium">CAIC pergunta</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Cadê as imagens?
        </h1>
      </header>

      {imageMode === null && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { k: "upload" as const, icon: Upload, t: "Vou subir as minhas", s: "Arrasta e solta os arquivos." },
            { k: "stock" as const, icon: ImageIcon, t: "Usa fotos aesthetic", s: "Eu busco no Unsplash + Pexels." },
            { k: "mix" as const, icon: Shuffle, t: "Mistura", s: "Subo algumas, você acha o resto." },
          ].map(({ k, icon: Icon, t, s }) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setImageMode(k);
                if (k === "stock" || k === "mix") fetchStock();
              }}
              className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-smooth"
            >
              <Icon className="h-5 w-5 text-primary mb-3" />
              <p className="font-display text-lg leading-snug mb-1">{t}</p>
              <p className="text-sm text-muted-foreground">{s}</p>
            </button>
          ))}
        </div>
      )}

      {imageMode !== null && (
        <>
          <button
            type="button"
            onClick={() => setImageMode(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
          >
            ← trocar de modo
          </button>

          {/* Slots por slide */}
          <div className="grid gap-3 sm:grid-cols-2">
            {slides.map((s) => {
              const img = slideImages[s.index];
              return (
                <div
                  key={s.index}
                  className="rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">Slide {s.index}</span>
                    {img && (
                      <button
                        type="button"
                        onClick={() => removeImage(s.index)}
                        className="hover:text-foreground transition-smooth"
                        aria-label="Remover"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                    {img ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                        sem imagem
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(imageMode === "upload" || imageMode === "mix") && (
                      <label className="flex-1 cursor-pointer text-xs rounded-md border border-border px-2 py-1.5 text-center hover:border-primary transition-smooth">
                        <Upload className="h-3 w-3 inline mr-1" />
                        Subir
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) assignUpload(s.index, f);
                          }}
                        />
                      </label>
                    )}
                    {(imageMode === "stock" || imageMode === "mix") && (
                      <button
                        type="button"
                        onClick={() => setPickingForSlide(s.index)}
                        className="flex-1 text-xs rounded-md border border-border px-2 py-1.5 hover:border-primary transition-smooth"
                      >
                        <ImageIcon className="h-3 w-3 inline mr-1" />
                        Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stock picker */}
          {(imageMode === "stock" || imageMode === "mix") && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchStock(stockQuery)}
                  placeholder="buscar palavras (ex: minimal desk, sunset)"
                  className="flex-1 bg-transparent border-b border-border px-1 py-1 text-sm focus:outline-none focus:border-primary"
                />
                <Button size="sm" variant="outline" onClick={() => fetchStock(stockQuery)}>
                  Buscar
                </Button>
              </div>
              {pickingForSlide !== null && (
                <p className="text-xs text-primary">
                  Escolhendo pra slide {pickingForSlide} — clica numa foto.
                </p>
              )}

              {loadingStock ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">CAIC garimpando…</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {stockImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        if (pickingForSlide !== null) assignStock(pickingForSlide, img);
                        else {
                          // auto-atribui pro primeiro slide sem imagem
                          const empty = slides.find((s) => !slideImages[s.index]);
                          if (empty) assignStock(empty.index, img);
                        }
                      }}
                      className="group aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-smooth relative"
                    >
                      <img src={img.thumb} alt={img.credit} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-foreground/70 text-background text-[9px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {img.credit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ---------------- Step 7 — Render preview ---------------- */

const Step7 = ({
  rendering,
  renderedPreviews,
  previewSlide,
  setPreviewSlide,
  credits,
  onConfirm,
  onAdjust,
}: {
  rendering: boolean;
  renderedPreviews: { index: number; dataUrl: string }[];
  previewSlide: number;
  setPreviewSlide: (n: number) => void;
  credits: number | null;
  onConfirm: () => void;
  onAdjust: () => void;
}) => {
  if (rendering) {
    return (
      <div className="text-center py-16 space-y-5">
        <div className="mx-auto relative h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wand2 className="h-7 w-7 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="font-display text-2xl">Tô montando seu carrossel com molho…</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Renderizando os PNGs em 1080×1080. Demora uns segundos.
        </p>
      </div>
    );
  }

  if (!renderedPreviews.length) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Sem preview ainda.</div>;
  }

  const current = renderedPreviews[previewSlide];
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-primary font-medium">CAIC entregou</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Tá no jeito. Confere se ficou redondo.
        </h1>
      </header>

      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        <img src={current.dataUrl} alt={`slide ${current.index}`} className="w-full h-auto block" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreviewSlide(Math.max(0, previewSlide - 1))}
          disabled={previewSlide === 0}
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          {previewSlide + 1} / {renderedPreviews.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreviewSlide(Math.min(renderedPreviews.length - 1, previewSlide + 1))}
          disabled={previewSlide === renderedPreviews.length - 1}
        >
          Próximo <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onAdjust} disabled={(credits ?? 0) < 1}>
          <RefreshCw className="h-4 w-4" />
          Quero ajustar (1 crédito)
        </Button>
        <Button onClick={onConfirm} size="lg">
          Está perfeito <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/* ---------------- Step 8 — Final ---------------- */

const Step8 = ({
  onDownload,
  onBack,
}: {
  onDownload: () => void;
  onBack: () => void;
}) => (
  <div className="space-y-6 text-center py-6">
    <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
      <Check className="h-7 w-7 text-primary" />
    </div>
    <header className="space-y-2">
      <p className="text-sm text-primary font-medium">CAIC orgulhoso</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight">
        Pronto. Bora colocar o filho no mundo?
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Tá tudo salvo nos seus carrosséis. Pode baixar agora ou voltar pra galeria.
      </p>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
      <button
        type="button"
        onClick={onDownload}
        className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-smooth"
      >
        <Download className="h-5 w-5 text-primary mb-3" />
        <p className="font-display text-lg leading-snug mb-1">Baixar agora</p>
        <p className="text-sm text-muted-foreground">.zip com os PNGs + legenda.</p>
      </button>
      <button
        type="button"
        onClick={() =>
          toast({
            title: "Em breve",
            description: "Agendamento via Buffer/Later chega na próxima versão.",
          })
        }
        className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-smooth opacity-80"
      >
        <CalendarClock className="h-5 w-5 text-primary mb-3" />
        <p className="font-display text-lg leading-snug mb-1">Agendar pra depois</p>
        <p className="text-sm text-muted-foreground">Em breve — Buffer / Later.</p>
      </button>
    </div>

    <Button variant="ghost" onClick={onBack} className="mt-2">
      <ArrowLeft className="h-4 w-4" /> Voltar pra meus carrosséis
    </Button>
  </div>
);

