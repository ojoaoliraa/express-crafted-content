import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, FileText, Loader2, Download, Copy, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Carousel {
  id: string;
  idea: string | null;
  status: string;
  created_at: string;
  copy_json: any;
  images_json: any;
  format_chosen: string | null;
  objective: string | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const Dashboard = () => {
  const { user } = useAuth();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Carousel | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("carousels")
        .select("id, idea, status, created_at, copy_json, images_json, format_chosen, objective")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) {
          toast({ title: "Não consegui carregar seus carrosséis.", variant: "destructive" });
        } else {
          setCarousels(data ?? []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-10 md:space-y-14">
        {/* Seção 1 — Bora criar */}
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="absolute inset-0 bg-purple-gradient opacity-95" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
            <div className="relative p-8 md:p-14 flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1 space-y-4 text-primary-foreground">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-90">
                  <Sparkles className="h-3.5 w-3.5" /> Bora criar?
                </span>
                <h1 className="font-display text-3xl md:text-5xl font-medium leading-[1.05] tracking-tight">
                  Pronto pra outro<br />carrossel com molho?
                </h1>
                <p className="text-primary-foreground/80 max-w-md">
                  Em poucos passos eu monto copy e visuais alinhados com a sua marca.
                </p>
              </div>
              <div className="md:flex-shrink-0">
                <Button
                  asChild
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 h-14 px-8 text-base shadow-elegant"
                >
                  <Link to="/app/criar">
                    <Sparkles className="h-5 w-5" />
                    Criar carrossel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2 — Seus carrosséis */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
                Seus carrosséis com molho
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tudo o que você já criou aqui dentro.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : carousels.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {carousels.map((c) => (
                <CarouselCard key={c.id} carousel={c} onClick={() => setSelected(c)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <CarouselPreviewDialog
        carousel={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </AppLayout>
  );
};

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                     */
/* ------------------------------------------------------------------ */

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 md:p-16 text-center">
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/60">
      <FileText className="h-9 w-9 text-primary" />
    </div>
    <h3 className="font-display text-xl md:text-2xl font-medium mb-2">
      Ainda não tem carrossel aqui.
    </h3>
    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
      Que tal criar o primeiro? Eu prometo capricho.
    </p>
    <Button asChild>
      <Link to="/app/criar">
        <Sparkles className="h-4 w-4" />
        Criar meu primeiro
      </Link>
    </Button>
  </div>
);

const CarouselCard = ({
  carousel,
  onClick,
}: {
  carousel: Carousel;
  onClick: () => void;
}) => {
  const firstImage = Array.isArray(carousel.images_json)
    ? (carousel.images_json[0] as any)?.url ?? null
    : null;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl border border-border bg-card overflow-hidden shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-0.5"
    >
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={carousel.idea ?? "Carrossel"}
            className="w-full h-full object-cover transition-smooth group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-purple-gradient opacity-90 flex items-center justify-center">
            <span className="font-display text-primary-foreground/80 text-5xl">caic</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className={
              carousel.status === "approved"
                ? "bg-primary text-primary-foreground"
                : "bg-background/90 text-foreground"
            }
          >
            {carousel.status === "approved" ? "Aprovado" : "Rascunho"}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-1">
        <p className="text-sm font-medium line-clamp-1">
          {carousel.idea ?? "Sem título"}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(carousel.created_at)}</p>
      </div>
    </button>
  );
};

const CarouselPreviewDialog = ({
  carousel,
  open,
  onOpenChange,
}: {
  carousel: Carousel | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  if (!carousel) return null;

  const slides: Array<{ url?: string; title?: string; body?: string }> = (() => {
    const images = Array.isArray(carousel.images_json) ? carousel.images_json : [];
    const copy = Array.isArray(carousel.copy_json) ? carousel.copy_json : [];
    const len = Math.max(images.length, copy.length, 1);
    return Array.from({ length: len }, (_, i) => ({
      url: (images[i] as any)?.url,
      title: (copy[i] as any)?.title,
      body: (copy[i] as any)?.body,
    }));
  })();

  const caption = (carousel.copy_json as any)?.caption ?? "";

  const handleCopy = async () => {
    if (!caption) {
      toast({ title: "Esse carrossel ainda não tem legenda." });
      return;
    }
    await navigator.clipboard.writeText(caption);
    toast({ title: "Legenda copiada!" });
  };

  const handleDownload = async () => {
    const urls = slides.map((s) => s.url).filter(Boolean) as string[];
    if (urls.length === 0) {
      toast({ title: "Nenhuma imagem para baixar ainda." });
      return;
    }
    urls.forEach((u, i) => {
      const a = document.createElement("a");
      a.href = u;
      a.download = `caic-${carousel.id.slice(0, 8)}-${i + 1}.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {carousel.idea ?? "Carrossel"}
          </DialogTitle>
          <DialogDescription>
            {formatDate(carousel.created_at)} ·{" "}
            {carousel.status === "approved" ? "Aprovado" : "Rascunho"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {slides.map((s, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl border border-border bg-secondary overflow-hidden relative"
            >
              {s.url ? (
                <img src={s.url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full p-3 flex flex-col gap-2 bg-purple-gradient text-primary-foreground">
                  <span className="text-xs opacity-80">Slide {i + 1}</span>
                  <p className="font-display text-base leading-tight line-clamp-3">
                    {s.title ?? "—"}
                  </p>
                  <p className="text-xs opacity-80 line-clamp-3">{s.body ?? ""}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {caption && (
          <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm whitespace-pre-wrap">
            {caption}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4" /> Copiar legenda
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4" /> Baixar PNGs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Dashboard;
