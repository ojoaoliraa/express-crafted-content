import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TermsModalProps {
  userId: string;
  onAccepted: () => void;
}

/**
 * Modal bloqueante de aceite de Termos + Privacidade.
 * Aparece no primeiro acesso após o onboarding, antes do dashboard.
 */
export function TermsModal({ userId, onAccepted }: TermsModalProps) {
  const { toast } = useToast();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [optin, setOptin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = terms && privacy && !submitting;

  const handleAccept = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: now,
          privacy_accepted_at: now,
          data_optin: optin,
        })
        .eq("id", userId);
      if (error) throw error;
      onAccepted();
    } catch (e) {
      console.error("TermsModal accept error", e);
      toast({
        title: "Não consegui salvar",
        description: "Tenta de novo daqui a pouco?",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open modal>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Antes de começar</DialogTitle>
          <DialogDescription>
            Pra deixar tudo redondo: leia e aceite nossos termos. Leva 2 minutos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={terms}
              onCheckedChange={(v) => setTerms(v === true)}
              className="mt-1"
            />
            <span className="text-sm leading-relaxed">
              Li e aceito os{" "}
              <Link
                to="/termos"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Termos de Uso
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={privacy}
              onCheckedChange={(v) => setPrivacy(v === true)}
              className="mt-1"
            />
            <span className="text-sm leading-relaxed">
              Li e aceito a{" "}
              <Link
                to="/privacidade"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer pt-2 border-t">
            <Checkbox
              checked={optin}
              onCheckedChange={(v) => setOptin(v === true)}
              className="mt-1"
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Opcional:</strong> aceito que
              meus carrosséis sejam usados de forma anônima para melhorar o
              CAIC. Você pode mudar isso a qualquer momento nas configurações.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!canSubmit} className="w-full sm:w-auto">
            {submitting ? "Salvando…" : "Concordo e quero entrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
