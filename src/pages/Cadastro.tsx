import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";
import { GoogleButton } from "@/components/GoogleButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginPath } from "@/lib/postLoginRedirect";

const Cadastro = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      getPostLoginPath(user.id).then((path) => navigate(path, { replace: true }));
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Senha curtinha demais",
        description: "Use pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name },
      },
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Não consegui criar a conta",
        description: error.message === "User already registered"
          ? "Esse email já tem conta. Tenta entrar."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada 🟣",
      description: "Confirme seu email se for solicitado e já podemos começar.",
    });
  };

  return (
    <AuthLayout
      eyebrow="Vamos criar"
      title={<>Bora fazer carrosséis <span className="italic text-primary">com molho</span>.</>}
      subtitle={<>"Prazer, eu sou o CAIC. Vou te ajudar a fazer carrosséis com molho."</>}
      footer={
        <>Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton label="Criar conta com Google" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-card px-3 text-muted-foreground">ou com email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Como você se chama</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-purple-gradient hover:opacity-90 transition-smooth"
            disabled={submitting}
          >
            {submitting ? "Criando..." : "Criar conta"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Cadastro;
