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
    { index: number; title: string; body: string; kind: string }[]
  >([]);
  const [caption, setCaption] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

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
      const ideas: string[] = data?.ideas ?? [];
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

  const generateCopy = async (isRegeneration = false) => {
    if (!chosenFormat) return;
    setGenerating(true);
    try {
      const sauceList = (Object.keys(sauces) as SauceKey[])
        .filter((k) => sauces[k])
        .map((k) => ({ key: k, detail: sauceDetails[k] }));

      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          idea: finalIdea,
          objective,
          sauces: sauceList,
          format: {
            id: chosenFormat.id,
            name: chosenFormat.name,
            anchor_phrase: chosenFormat.anchor_phrase,
            short_description: chosenFormat.short_description,
            slide_count: chosenFormat.slide_count,
          },
          isRegeneration,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSlides(data.slides ?? []);
      setCaption(data.caption ?? "");
    } catch (err: any) {
      console.error(err);
      const msg = err?.message ?? "Não consegui gerar a copy agora.";
      toast({
        title: "Deu ruim na geração",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleChooseFormat = async (f: CarouselFormat) => {
    setChosenFormat(f);
    setSlides([]);
    setCaption("");
    setStep(5);
    // Dispara geração inicial logo em seguida
    setTimeout(() => generateCopyFor(f, false), 0);
  };

  // Wrapper que recebe o formato direto (evita race do setState)
  const generateCopyFor = async (format: CarouselFormat, isRegeneration: boolean) => {
    setGenerating(true);
    try {
      const sauceList = (Object.keys(sauces) as SauceKey[])
        .filter((k) => sauces[k])
        .map((k) => ({ key: k, detail: sauceDetails[k] }));

      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          idea: finalIdea,
          objective,
          sauces: sauceList,
          format: {
            id: format.id,
            name: format.name,
            anchor_phrase: format.anchor_phrase,
            short_description: format.short_description,
            slide_count: format.slide_count,
          },
          isRegeneration,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSlides(data.slides ?? []);
      setCaption(data.caption ?? "");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Deu ruim na geração",
        description: err?.message ?? "Tenta de novo em instantes.",
        variant: "destructive",
      });
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
    const text = [finalIdea, ...slides.map((s) => `${s.title} ${s.body}`)].join(" ");
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
        body: { query },
      });
      if (error) throw error;
      setStockImages(data?.images ?? []);
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
      [index]: { url: img.url, source: "stock", credit: img.credit, stockMeta: img },
    }));
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
      // espera o DOM dos render targets montar
      await new Promise((r) => setTimeout(r, 200));
      const previews: { index: number; dataUrl: string }[] = [];
      const blobs: { index: number; blob: Blob }[] = [];
      for (const s of slides) {
        const node = renderRefs.current[s.index];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          pixelRatio: 1,
          cacheBust: true,
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
            <Button variant="ghost" onClick={handleBack} disabled={generating || rendering}>
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>
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
            <SlideCard
              key={`render-${s.index}`}
              ref={(el) => (renderRefs.current[s.index] = el)}
              index={s.index}
              total={slides.length}
              title={s.title}
              body={s.body}
              kind={s.kind}
              imageUrl={slideImages[s.index]?.url}
              variant="render"
            />
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
  title: string;
  body: string;
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
      <div className="text-center py-12 text-muted-foreground text-sm">
        Aguardando o CAIC…
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
            <input
              value={s.title}
              onChange={(e) => updateSlide(s.index, { title: e.target.value })}
              className="w-full bg-transparent font-display text-lg leading-tight focus:outline-none focus:ring-0 border-0 p-0"
            />
            <Textarea
              value={s.body}
              onChange={(e) => updateSlide(s.index, { body: e.target.value })}
              className="min-h-20 text-sm border-dashed"
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
