import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CarouselSlide, SLIDE_W, SLIDE_H, type VisualStyle } from "@/components/CarouselSlide";

const LOG = "[CAIC-RENDER]";

interface SlideInput {
  index: number;
  text: string;
  imageUrl: string;
}

type SlideStatus = "waiting" | "image_ready" | "image_failed" | "uploading" | "done" | "failed";

interface SlideState extends SlideInput {
  status: SlideStatus;
  publicUrl?: string;
}

const VISUAL_STYLES: VisualStyle[] = [
  "minimalista_editorial",
  "quente_organico",
  "moderno_geometrico",
  "suave_pastel",
  "sofisticado_escuro",
];

function asVisualStyle(s: string | null | undefined): VisualStyle {
  if (s && (VISUAL_STYLES as string[]).includes(s)) return s as VisualStyle;
  return "minimalista_editorial";
}

export default function CriarCarrosselRender() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const carouselId = params.get("id") ?? "";

  const [slides, setSlides] = useState<SlideState[]>([]);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("minimalista_editorial");
  const [phase, setPhase] = useState<"loading" | "waiting_images" | "rendering" | "done" | "error">(
    "loading",
  );
  const [progressIdx, setProgressIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const framesRef = useRef<Record<number, HTMLDivElement | null>>({});

  // 1) Carrega carrossel
  useEffect(() => {
    if (!carouselId) {
      setErrorMsg("Faltou identificar o carrossel — volta uma tela e tenta de novo.");
      setPhase("error");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: carousel, error } = await supabase
          .from("carousels")
          .select("id, copy_json, images_json")
          .eq("id", carouselId)
          .maybeSingle();
        if (error) throw error;
        if (!carousel) throw new Error("carrossel não existe");

        const copy = (carousel.copy_json ?? {}) as {
          slides?: { index: number; text: string }[];
        };
        const imgs = (carousel.images_json ?? {}) as {
          slides_with_images?: { index: number; imageUrl: string }[];
          visual_style?: string;
        };

        const copySlides = copy.slides ?? [];
        const imageMap = new Map<number, string>(
          (imgs.slides_with_images ?? []).map((s) => [s.index, s.imageUrl]),
        );

        const initial: SlideState[] = copySlides.map((s) => ({
          index: s.index,
          text: s.text,
          imageUrl: imageMap.get(s.index) ?? "",
          status: imageMap.get(s.index) ? "waiting" : "image_failed",
        }));

        if (cancelled) return;
        setVisualStyle(asVisualStyle(imgs.visual_style));
        setSlides(initial);
        setPhase(initial.every((s) => s.status === "image_failed") ? "error" : "waiting_images");

        if (initial.every((s) => s.status === "image_failed")) {
          setErrorMsg("Nenhuma imagem disponível pros slides — volta uma tela pra escolher.");
        }
      } catch (e) {
        console.error(LOG, "load carousel failed", e);
        setErrorMsg("Não consegui abrir esse carrossel — tenta de novo?");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [carouselId, retryToken]);

  // 2) Marca slide com imagem carregada
  const handleImageReady = useCallback((idx: number) => {
    setSlides((prev) =>
      prev.map((s) => (s.index === idx && s.status === "waiting" ? { ...s, status: "image_ready" } : s)),
    );
  }, []);

  const handleImageError = useCallback((idx: number) => {
    console.error(LOG, `image failed for slide ${idx}`);
    setSlides((prev) =>
      prev.map((s) => (s.index === idx ? { ...s, status: "image_failed" } : s)),
    );
  }, []);

  // 3) Dispara renderização quando todas as imagens estiverem prontas
  useEffect(() => {
    if (phase !== "waiting_images" || slides.length === 0) return;
    const allResolved = slides.every((s) => s.status !== "waiting");
    if (!allResolved) return;

    const renderable = slides.filter((s) => s.status === "image_ready");
    if (renderable.length === 0) {
      setErrorMsg("Nenhuma imagem carregou — quer escolher outras?");
      setPhase("error");
      return;
    }

    let cancelled = false;
    (async () => {
      setPhase("rendering");
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("sessão expirada");

        const uploadedUrls: { index: number; url: string }[] = [];

        for (let i = 0; i < slides.length; i++) {
          if (cancelled) return;
          const slide = slides[i];
          setProgressIdx(i + 1);

          if (slide.status !== "image_ready") {
            console.warn(LOG, `pulando slide ${slide.index} (status=${slide.status})`);
            continue;
          }

          try {
            const frame = framesRef.current[slide.index];
            if (!frame) throw new Error("frame não encontrado");

            const dataUrl = await toPng(frame, {
              pixelRatio: 1,
              cacheBust: true,
              width: SLIDE_W,
              height: SLIDE_H,
            });

            const blob = await (await fetch(dataUrl)).blob();
            const path = `${userId}/${carouselId}/slide_${slide.index}.png`;

            const { error: upErr } = await supabase.storage
              .from("carousel-images")
              .upload(path, blob, { contentType: "image/png", upsert: true });
            if (upErr) throw upErr;

            const { data: signed, error: signErr } = await supabase.storage
              .from("carousel-images")
              .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 ano
            if (signErr || !signed) throw signErr ?? new Error("signed url falhou");

            uploadedUrls.push({ index: slide.index, url: signed.signedUrl });

            setSlides((prev) =>
              prev.map((s) =>
                s.index === slide.index ? { ...s, status: "done", publicUrl: signed.signedUrl } : s,
              ),
            );
          } catch (e) {
            console.error(LOG, `slide ${slide.index} falhou:`, e);
            setSlides((prev) =>
              prev.map((s) => (s.index === slide.index ? { ...s, status: "failed" } : s)),
            );
          }
        }

        if (cancelled) return;

        if (uploadedUrls.length === 0) {
          setErrorMsg("Não consegui guardar nenhum slide — tenta de novo?");
          setPhase("error");
          return;
        }

        // Finaliza no servidor
        const sortedUrls = uploadedUrls.sort((a, b) => a.index - b.index).map((u) => u.url);
        const { error: fnErr } = await supabase.functions.invoke("render-carousel", {
          body: { carousel_id: carouselId, image_urls: sortedUrls },
        });
        if (fnErr) throw fnErr;

        setPhase("done");
        toast({ title: "Pronto!", description: "Seu carrossel tá no mundo." });
      } catch (e) {
        console.error(LOG, "render pipeline failed", e);
        setErrorMsg("Faltou um tempero na conexão — tenta de novo?");
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slides.length, slides.every((s) => s.status !== "waiting")]);

  const totalSlides = slides.length;
  const progressPct = totalSlides > 0 ? Math.round((progressIdx / totalSlides) * 100) : 0;
  const failedSlides = slides.filter((s) => s.status === "failed" || s.status === "image_failed");

  return (
    <div className="min-h-screen bg-background">
      {/* Frames invisíveis usados na exportação */}
      <div
        aria-hidden
        style={{ position: "absolute", top: -99999, left: -99999, pointerEvents: "none" }}
      >
        {slides.map((s) => (
          <div
            key={s.index}
            ref={(el) => {
              framesRef.current[s.index] = el;
            }}
          >
            <CarouselSlide
              text={s.text}
              imageUrl={s.imageUrl}
              visualStyle={visualStyle}
              slideIndex={s.index}
              onReady={handleImageReady}
              onImageError={handleImageError}
            />
          </div>
        ))}
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Link
          to="/app/criar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {phase === "loading" || phase === "waiting_images" ? (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-semibold">Tô preparando o estúdio…</h1>
            <p className="text-muted-foreground">
              Carregando as imagens dos {totalSlides || "?"} slides.
            </p>
            <Progress value={10} />
          </div>
        ) : null}

        {phase === "rendering" ? (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-semibold">Renderizando seu carrossel</h1>
            <p className="text-muted-foreground">
              Slide {progressIdx} de {totalSlides}…
            </p>
            <Progress value={progressPct} />
          </div>
        ) : null}

        {phase === "done" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold text-center">Tá no mundo!</h1>
            <p className="text-center text-muted-foreground">
              Seu carrossel tá pronto. Bora exportar.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {slides
                .filter((s) => s.publicUrl)
                .map((s) => (
                  <img
                    key={s.index}
                    src={s.publicUrl}
                    alt={`Slide ${s.index}`}
                    className="w-full rounded-lg border"
                  />
                ))}
            </div>
            {failedSlides.length > 0 ? (
              <p className="text-sm text-amber-600 text-center">
                {failedSlides.length} slide(s) não renderizaram. Volte e troque as imagens se quiser.
              </p>
            ) : null}
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate("/app")}>Ver meus carrosséis</Button>
              <Button variant="outline" onClick={() => navigate(`/app/criar?id=${carouselId}`)}>
                Editar de novo
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "error" ? (
          <div className="space-y-6 text-center">
            <h1 className="text-3xl font-semibold">Travou no caminho</h1>
            <p className="text-muted-foreground">
              {errorMsg ?? "Algo não rolou — bora tentar de novo?"}
            </p>
            {failedSlides.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Slides com problema: {failedSlides.map((s) => s.index).join(", ")}
              </p>
            ) : null}
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setErrorMsg(null);
                  setSlides([]);
                  setProgressIdx(0);
                  setPhase("loading");
                  setRetryToken((t) => t + 1);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Tentar de novo
              </Button>
              <Button variant="outline" onClick={() => navigate(`/app/criar?id=${carouselId}`)}>
                Escolher outras imagens
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
