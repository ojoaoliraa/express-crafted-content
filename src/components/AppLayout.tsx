import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Home, Settings, LogOut, Sparkles, User } from "lucide-react";
import { CaicMark } from "@/components/CaicMark";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TermsModal } from "@/components/TermsModal";

interface AppLayoutProps {
  children: ReactNode;
}

interface ProfileLite {
  name: string | null;
  email: string | null;
  credits_remaining: number;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileLite | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, email, credits_remaining, terms_accepted_at, privacy_accepted_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data) setProfile(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const initials = (profile?.name || profile?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const credits = profile?.credits_remaining ?? 0;

  return (
    <div className="min-h-screen bg-background bg-hero-gradient pb-20 md:pb-0">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between gap-3 py-4">
          <CaicMark />

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Você tem</span>
            <span className="font-semibold text-foreground">{credits}</span>
            <span className="text-muted-foreground">
              {credits === 1 ? "carrossel disponível" : "carrosséis disponíveis"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-offset-background transition-smooth hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{profile?.name || "Sem nome"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/configuracoes" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" /> Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile credits row */}
        <div className="sm:hidden container pb-3 flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Você tem</span>
          <span className="font-semibold text-foreground">{credits}</span>
          <span className="text-muted-foreground">
            {credits === 1 ? "carrossel" : "carrosséis"}
          </span>
        </div>
      </header>

      <main className="container py-6 md:py-10">{children}</main>

      {user && profile && (!profile.terms_accepted_at || !profile.privacy_accepted_at) ? (
        <TermsModal
          userId={user.id}
          onAccepted={() => {
            const now = new Date().toISOString();
            setProfile((p) =>
              p ? { ...p, terms_accepted_at: now, privacy_accepted_at: now } : p,
            );
          }}
        />
      ) : null}

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-3 h-16">
          <BottomLink to="/app" icon={<Home className="h-5 w-5" />} label="Início" exact />
          <BottomLink to="/app/criar" icon={<Sparkles className="h-5 w-5" />} label="Criar" />
          <BottomLink to="/app/configuracoes" icon={<User className="h-5 w-5" />} label="Conta" />
        </div>
      </nav>
    </div>
  );
};

const BottomLink = ({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  exact?: boolean;
}) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      cn(
        "flex flex-col items-center justify-center gap-1 text-xs transition-smooth",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);
