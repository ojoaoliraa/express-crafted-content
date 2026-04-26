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

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Não rolou entrar",
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Boa, você está dentro." });
  };

  return (
    <AuthLayout
      eyebrow="Bem-vindo de volta"
      title={<>De volta pra <span className="italic text-primary">cozinha</span>.</>}
      subtitle={<>"Prazer, eu sou o CAIC. Vou te ajudar a fazer carrosséis com molho."</>}
      footer={
        <>Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton label="Entrar com Google" />

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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-purple-gradient hover:opacity-90 transition-smooth"
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
