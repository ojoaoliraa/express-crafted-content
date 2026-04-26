import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CaicMark } from "@/components/CaicMark";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginPath } from "@/lib/postLoginRedirect";
import heroArt from "@/assets/hero-illustration.jpg";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Se já está logado, manda direto pra app
  useEffect(() => {
    if (!loading && user) {
      getPostLoginPath(user.id).then((path) => navigate(path, { replace: true }));
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background bg-hero-gradient">
      <header className="container flex items-center justify-between py-6">
        <CaicMark />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-purple-gradient hover:opacity-90 transition-smooth">
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </nav>
      </header>

      <main className="container">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center pt-12 lg:pt-20 pb-20">
          <div className="space-y-8 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Creative AI for Creators
            </span>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight">
              Carrosséis de Instagram{" "}
              <span className="italic text-primary">com molho</span>
              <span className="text-muted-foreground"> —</span>
              <br />
              gerados pelo CAIC.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Você traz a ideia. O CAIC traz o tempero, o ritmo e o visual.
              Carrosséis editoriais, com personalidade, prontos pra publicar.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" asChild className="bg-purple-gradient hover:opacity-90 transition-smooth shadow-elegant text-base h-12 px-7">
                <Link to="/cadastro">Criar conta</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base h-12 px-7">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-4 italic font-display">
              "Prazer, eu sou o CAIC. Vou te ajudar a fazer carrosséis com molho."
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-purple-gradient opacity-10 blur-3xl rounded-full" />
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-elegant border border-border bg-card">
              <img
                src={heroArt}
                alt="Composição editorial abstrata em roxo profundo sobre fundo creme — identidade do CAIC"
                width={1280}
                height={1280}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CAIC — Creative AI for Creators</span>
          <span className="font-display italic">feito com molho</span>
        </footer>
      </main>
    </div>
  );
};

export default Index;
