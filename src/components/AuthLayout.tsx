import { ReactNode } from "react";
import { CaicMark } from "@/components/CaicMark";

interface AuthLayoutProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthLayout = ({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) => (
  <div className="min-h-screen bg-background bg-hero-gradient">
    <header className="container py-6">
      <CaicMark />
    </header>

    <main className="container flex justify-center py-8 md:py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          {eyebrow && (
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-primary font-medium">
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-base leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft">
          {children}
        </div>

        {footer && (
          <div className="text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </main>
  </div>
);
