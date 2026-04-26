import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CaicMark } from "@/components/CaicMark";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Opções                                                             */
/* ------------------------------------------------------------------ */

const POSITIONING = [
  "Mentoria, coaching ou consultoria",
  "Curso ou infoproduto",
  "Serviço B2B (agência, software, consultoria corporativa)",
  "Hotelaria, turismo ou espaço físico",
  "Produto físico de consumo",
  "Saúde, terapia ou bem-estar",
  "SaaS ou tecnologia",
  "Outro",
] as const;

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
] as const;

const TONES = [
  { label: "Acolhedor e íntimo", desc: "“converso como uma amiga”" },
  { label: "Reflexivo e sutil", desc: "“provoco com perguntas”" },
  { label: "Direto e assertivo", desc: "“vou ao ponto”" },
  { label: "Aspiracional e sensorial", desc: "“evoco sensações”" },
  { label: "Vulnerável e autoral", desc: "“conto minha jornada”" },
] as const;

type VisualStyle = {
  label: string;
  desc: string;
  swatch: string; // tailwind classes for thumbnail
};

const VISUAL_STYLES: VisualStyle[] = [
  {
    label: "Minimalista e editorial",
    desc: "muito branco, serifa, fotos calmas",
    swatch:
      "bg-[hsl(38_33%_98%)] border border-border [&>span]:font-display [&>span]:text-foreground",
  },
  {
    label: "Quente e orgânico",
    desc: "tons terrosos, manuscrito, fotos de cotidiano",
    swatch:
      "bg-[hsl(28_45%_82%)] [&>span]:text-[hsl(20_50%_25%)] [&>span]:italic [&>span]:font-display",
  },
  {
    label: "Moderno e geométrico",
    desc: "sans-serif forte, contrastes altos",
    swatch:
      "bg-[hsl(0_0%_8%)] [&>span]:text-[hsl(60_90%_60%)] [&>span]:font-bold [&>span]:tracking-tight",
  },
  {
    label: "Suave e pastel",
    desc: "tons aquarelados, fotos suaves",
    swatch:
      "bg-[hsl(330_50%_92%)] [&>span]:text-[hsl(280_30%_40%)] [&>span]:font-display",
  },
  {
    label: "Sofisticado e escuro",
    desc: "preto, dourado, fotos noturnas",
    swatch:
      "bg-[hsl(0_0%_4%)] [&>span]:text-[hsl(40_70%_60%)] [&>span]:font-display [&>span]:italic",
  },
];

/* ------------------------------------------------------------------ */
/*  Tipos / estado                                                     */
/* ------------------------------------------------------------------ */

type Answers = {
  positioning: string;
  positioningOther: string;
  audience: string[];
  tone: string;
  visualStyle: string;
  notes: string;
};

const initialAnswers: Answers = {
  positioning: "",
  positioningOther: "",
  audience: [],
  tone: "",
  visualStyle: "",
  notes: "",
};

const TOTAL_QUESTIONS = 4;

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/* ------------------------------------------------------------------ */

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = intro, 1..4 = perguntas, 5 = final
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);

  // Guarda de auth — quem não está logado vai pro login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Se já completou, manda pro app
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_complete) navigate("/app", { replace: true });
      });
  }, [user, navigate]);

  const progress = useMemo(() => {
    if (step === 0) return 0;
    if (step >= 5) return 100;
    return (step / TOTAL_QUESTIONS) * 100;
  }, [step]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        return (
          !!answers.positioning &&
          (answers.positioning !== "Outro" || answers.positioningOther.trim().length > 0)
        );
      case 2:
        return answers.audience.length >= 1 && answers.audience.length <= 3;
      case 3:
        return !!answers.tone;
      case 4:
        return !!answers.visualStyle;
      default:
        return true;
    }
  }, [step, answers]);

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const toggleAudience = (item: string) => {
    setAnswers((a) => {
      const has = a.audience.includes(item);
      if (has) return { ...a, audience: a.audience.filter((x) => x !== item) };
      if (a.audience.length >= 3) return a; // limite máx 3
      return { ...a, audience: [...a.audience, item] };
    });
  };

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const positioningValue =
        answers.positioning === "Outro"
          ? `Outro: ${answers.positioningOther.trim()}`
          : answers.positioning;

      const { error: insertErr } = await supabase.from("onboarding_responses").insert({
        user_id: user.id,
        product_positioning: positioningValue,
        target_audience: answers.audience.join(", "),
        tone_of_voice: answers.tone,
        visual_style: answers.visualStyle,
        additional_notes: answers.notes.trim() || null,
      });
      if (insertErr) throw insertErr;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);
      if (updateErr) throw updateErr;

      toast({
        title: "Tudo certo.",
        description: "Já te conheço o suficiente pra começar.",
      });
      navigate("/app", { replace: true });
    } catch (err) {
      console.error("[onboarding] failed to save", err);
      toast({
        title: "Não consegui salvar agora",
        description: "Tenta de novo em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-hero-gradient flex flex-col">
      {/* Header */}
      <header className="container flex items-center justify-between py-5">
        <CaicMark />
        {step > 0 && step <= TOTAL_QUESTIONS && (
          <span className="font-display text-sm text-muted-foreground">
            {step}/{TOTAL_QUESTIONS}
          </span>
        )}
      </header>

      {/* Progress */}
      {step > 0 && step <= TOTAL_QUESTIONS && (
        <div className="container">
          <Progress value={progress} className="h-1.5 bg-muted" />
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 container flex items-center justify-center py-10">
        <div
          key={step}
          className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {step === 0 && <IntroStep onStart={goNext} />}

          {step === 1 && (
            <QuestionShell
              eyebrow="Pergunta 1 de 4"
              title="Qual o posicionamento do seu produto ou serviço?"
              subtitle="Escolha o que mais se aproxima — depois a gente refina."
            >
              <div className="grid gap-2">
                {POSITIONING.map((opt) => (
                  <OptionRow
                    key={opt}
                    selected={answers.positioning === opt}
                    onClick={() => setAnswers((a) => ({ ...a, positioning: opt }))}
                    label={opt}
                  />
                ))}
                {answers.positioning === "Outro" && (
                  <Input
                    autoFocus
                    placeholder="Conta brevemente o que você faz..."
                    value={answers.positioningOther}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, positioningOther: e.target.value }))
                    }
                    maxLength={120}
                    className="mt-2"
                  />
                )}
              </div>
            </QuestionShell>
          )}

          {step === 2 && (
            <QuestionShell
              eyebrow="Pergunta 2 de 4"
              title="Pra quem você fala?"
              subtitle={`Escolha de 1 a 3 públicos. (${answers.audience.length}/3 selecionados)`}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {AUDIENCES.map((opt) => {
                  const selected = answers.audience.includes(opt);
                  const disabled = !selected && answers.audience.length >= 3;
                  return (
                    <OptionRow
                      key={opt}
                      selected={selected}
                      disabled={disabled}
                      onClick={() => toggleAudience(opt)}
                      label={opt}
                      multi
                    />
                  );
                })}
              </div>
            </QuestionShell>
          )}

          {step === 3 && (
            <QuestionShell
              eyebrow="Pergunta 3 de 4"
              title="Qual o seu tom de voz?"
              subtitle="Como você quer soar nos seus carrosséis."
            >
              <div className="grid gap-2">
                {TONES.map((t) => (
                  <OptionRow
                    key={t.label}
                    selected={answers.tone === t.label}
                    onClick={() => setAnswers((a) => ({ ...a, tone: t.label }))}
                    label={t.label}
                    hint={t.desc}
                  />
                ))}
              </div>
            </QuestionShell>
          )}

          {step === 4 && (
            <QuestionShell
              eyebrow="Pergunta 4 de 4"
              title="Qual estilo visual te representa?"
              subtitle="Pode mudar depois. Isso só me dá um ponto de partida."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {VISUAL_STYLES.map((v) => {
                  const selected = answers.visualStyle === v.label;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, visualStyle: v.label }))
                      }
                      className={cn(
                        "group text-left rounded-xl border p-3 transition-smooth",
                        selected
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border bg-card hover:border-primary/40 hover:bg-card/80",
                      )}
                    >
                      <div
                        className={cn(
                          "h-20 rounded-lg flex items-center justify-center mb-3",
                          v.swatch,
                        )}
                      >
                        <span className="text-lg">Aa</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium leading-tight">{v.label}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">
                            {v.desc}
                          </p>
                        </div>
                        {selected && (
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </QuestionShell>
          )}

          {step === 5 && (
            <FinalStep
              notes={answers.notes}
              onChangeNotes={(v) => setAnswers((a) => ({ ...a, notes: v }))}
            />
          )}

          {/* Navegação */}
          {step > 0 && (
            <div className="mt-10 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={submitting}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>

              {step < 5 ? (
                <Button
                  onClick={goNext}
                  disabled={!canAdvance}
                  className="bg-purple-gradient hover:opacity-90 transition-smooth gap-1.5 h-11 px-6"
                >
                  Avançar <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="bg-purple-gradient hover:opacity-90 transition-smooth gap-1.5 h-11 px-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>Vamos começar <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                     */
/* ------------------------------------------------------------------ */

const IntroStep = ({ onStart }: { onStart: () => void }) => (
  <div className="text-center space-y-8 py-8">
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      Primeiro acesso
    </div>

    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight">
      Prazer, eu sou o <span className="italic text-primary">CAIC</span>,
      <br className="hidden md:block" /> seu mais novo assistente criativo.
    </h1>

    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
      Estou pronto pra te servir carrosséis com molho, mas antes preciso te conhecer
      melhor. Responde 4 perguntinhas pra eu não chutar?
    </p>

    <div className="pt-4">
      <Button
        size="lg"
        onClick={onStart}
        className="bg-purple-gradient hover:opacity-90 transition-smooth shadow-elegant text-base h-12 px-10"
      >
        Bora <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const QuestionShell = ({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="font-display italic text-sm text-primary">{eyebrow}</p>
      <h2 className="font-display text-3xl md:text-4xl font-medium leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
      )}
    </div>
    {children}
  </div>
);

const OptionRow = ({
  selected,
  disabled,
  onClick,
  label,
  hint,
  multi,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  multi?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "w-full text-left rounded-lg border px-4 py-3 transition-smooth flex items-start gap-3",
      selected
        ? "border-primary bg-primary/5 shadow-soft"
        : "border-border bg-card hover:border-primary/40",
      disabled && "opacity-40 cursor-not-allowed hover:border-border",
    )}
  >
    <span
      className={cn(
        "mt-0.5 h-5 w-5 shrink-0 grid place-items-center border transition-smooth",
        multi ? "rounded" : "rounded-full",
        selected
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-background border-input",
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
    <span className="flex-1">
      <span className="block leading-tight">{label}</span>
      {hint && (
        <span className="block text-sm text-muted-foreground italic font-display mt-0.5">
          {hint}
        </span>
      )}
    </span>
  </button>
);

const FinalStep = ({
  notes,
  onChangeNotes,
}: {
  notes: string;
  onChangeNotes: (v: string) => void;
}) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="font-display italic text-sm text-primary">Quase lá</p>
      <h2 className="font-display text-3xl md:text-4xl font-medium leading-tight tracking-tight">
        Quer me contar mais alguma coisa sobre você ou seu negócio?
      </h2>
      <p className="text-muted-foreground leading-relaxed">Opcional. Mas ajuda.</p>
    </div>

    <Textarea
      value={notes}
      onChange={(e) => onChangeNotes(e.target.value)}
      maxLength={1000}
      placeholder="Ex: vendo cursos pra mães empreendedoras, meu diferencial é trazer espiritualidade pro marketing..."
      className="min-h-[160px] bg-card resize-none"
    />

    <div className="rounded-xl border border-border bg-card/60 p-4 italic font-display text-foreground/80 leading-relaxed">
      Pronto. Pode mudar tudo isso depois nas configurações sempre que quiser.
    </div>
  </div>
);
