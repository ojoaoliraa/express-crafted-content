import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Save, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const POSITIONING = [
  "Mentoria, coaching ou consultoria",
  "Curso ou infoproduto",
  "Serviço B2B (agência, software, consultoria corporativa)",
  "Hotelaria, turismo ou espaço físico",
  "Produto físico de consumo",
  "Saúde, terapia ou bem-estar",
  "SaaS ou tecnologia",
  "Outro",
];

const AUDIENCES = [
  "Mulheres 25-40",
  "Mulheres 40-60",
  "Homens 25-40",
  "Homens 40-60",
  "Profissionais liberais",
  "Empreendedores em estágio inicial",
  "Empreendedores consolidados",
  "Famílias",
  "Casais",
  "Pessoas em transição (de carreira, de vida)",
];

const TONES = [
  "Acolhedor e íntimo",
  "Reflexivo e sutil",
  "Direto e assertivo",
  "Aspiracional e sensorial",
  "Vulnerável e autoral",
];

const STYLES = [
  "Minimalista e editorial",
  "Quente e orgânico",
  "Moderno e geométrico",
  "Suave e pastel",
  "Sofisticado e escuro",
];

const Configuracoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<{ plan: string; credits_remaining: number } | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);

  // Form state
  const [positioning, setPositioning] = useState("");
  const [positioningOther, setPositioningOther] = useState("");
  const [audiences, setAudiences] = useState<string[]>([]);
  const [tone, setTone] = useState("");
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: resp }] = await Promise.all([
        supabase
          .from("profiles")
          .select("plan, credits_remaining")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("onboarding_responses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (prof) setProfile(prof);
      if (resp) {
        setResponseId(resp.id);
        // product_positioning may have "Outro: …" prefix
        const pos = resp.product_positioning ?? "";
        if (pos.startsWith("Outro:")) {
          setPositioning("Outro");
          setPositioningOther(pos.replace(/^Outro:\s*/, ""));
        } else {
          setPositioning(pos);
        }
        setAudiences(
          resp.target_audience
            ? resp.target_audience.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        );
        setTone(resp.tone_of_voice ?? "");
        setStyle(resp.visual_style ?? "");
        setNotes(resp.additional_notes ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleAudience = (a: string) => {
    setAudiences((prev) => {
      if (prev.includes(a)) return prev.filter((x) => x !== a);
      if (prev.length >= 3) {
        toast({ title: "Máximo 3 públicos." });
        return prev;
      }
      return [...prev, a];
    });
  };

  const handleSave = async () => {
    if (!user) return;
    if (!positioning || audiences.length === 0 || !tone || !style) {
      toast({ title: "Preencha as 4 perguntas antes de salvar.", variant: "destructive" });
      return;
    }
    if (!acceptedTerms) {
      toast({ title: "É preciso aceitar os termos.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      product_positioning:
        positioning === "Outro" && positioningOther
          ? `Outro: ${positioningOther}`
          : positioning,
      target_audience: audiences.join(", "),
      tone_of_voice: tone,
      visual_style: style,
      additional_notes: notes || null,
    };

    const { error } = responseId
      ? await supabase.from("onboarding_responses").update(payload).eq("id", responseId)
      : await supabase.from("onboarding_responses").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar.", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Tudo salvo!" });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
            Configurações
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            Sua marca, do seu jeito
          </h1>
          <p className="text-muted-foreground">
            Edite as respostas do onboarding sempre que quiser. Vou usar isso pra cada carrossel.
          </p>
        </header>

        {/* Plano e créditos */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-medium">Plano e créditos</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="capitalize">
                  Plano {profile?.plan ?? "free"}
                </Badge>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {profile?.credits_remaining ?? 0} carrosséis disponíveis
                </span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/planos">Gerenciar plano</Link>
            </Button>
          </div>
        </section>

        {/* Onboarding edit */}
        <section className="space-y-8 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
          <h2 className="font-display text-xl font-medium">Sobre o seu negócio</h2>

          {/* Posicionamento */}
          <div className="space-y-3">
            <Label className="text-base">Posicionamento</Label>
            <RadioGroup value={positioning} onValueChange={setPositioning} className="grid gap-2">
              {POSITIONING.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/60 transition-smooth"
                >
                  <RadioGroupItem value={opt} />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </RadioGroup>
            {positioning === "Outro" && (
              <Input
                placeholder="Conta pra mim…"
                value={positioningOther}
                onChange={(e) => setPositioningOther(e.target.value)}
              />
            )}
          </div>

          <Separator />

          {/* Público */}
          <div className="space-y-3">
            <Label className="text-base">
              Público-alvo <span className="text-muted-foreground text-sm">(até 3)</span>
            </Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {AUDIENCES.map((a) => {
                const checked = audiences.includes(a);
                return (
                  <label
                    key={a}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/60 transition-smooth"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleAudience(a)} />
                    <span className="text-sm">{a}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Tom */}
          <div className="space-y-3">
            <Label className="text-base">Tom de voz</Label>
            <RadioGroup value={tone} onValueChange={setTone} className="grid gap-2">
              {TONES.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/60 transition-smooth"
                >
                  <RadioGroupItem value={t} />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Estilo visual */}
          <div className="space-y-3">
            <Label className="text-base">Estilo visual</Label>
            <RadioGroup value={style} onValueChange={setStyle} className="grid gap-2">
              {STYLES.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/60 transition-smooth"
                >
                  <RadioGroupItem value={s} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Notas */}
          <div className="space-y-3">
            <Label className="text-base" htmlFor="notes">
              Mais alguma coisa?
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qualquer detalhe que me ajude a te servir melhor."
              rows={4}
            />
          </div>
        </section>

        {/* Termos */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(v === true)}
              className="mt-1"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              Aceito os{" "}
              <Link to="/termos" className="text-primary underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link to="/privacidade" className="text-primary underline underline-offset-2">
                Política de Privacidade
              </Link>{" "}
              do CAIC.
            </span>
          </label>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Salvar alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
