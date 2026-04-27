import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Lightbulb, Loader2, Check } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TOTAL_STEPS = 5;

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
    // Próxima parte do fluxo: etapa 4 — formatos
    toast({
      title: "Próximo passo em construção",
      description: "A apresentação dos 3+1 formatos chega na próxima etapa.",
    });
    setStep(4);
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
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl">Os formatos chegam aqui</h2>
              <p className="text-muted-foreground text-sm">
                Próxima parte do fluxo — apresentação dos 3+1 formatos.
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

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
        </div>
      </div>
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
