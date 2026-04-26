import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

const CriarCarrossel = () => (
  <AppLayout>
    <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
        O criador chega no próximo passo
      </h1>
      <p className="text-muted-foreground">
        Aqui vai morar o fluxo de geração de carrossel — copy, imagens e aprovação.
        Por enquanto, volta pro painel.
      </p>
      <Button asChild variant="outline">
        <Link to="/app">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>
      </Button>
    </div>
  </AppLayout>
);

export default CriarCarrossel;
