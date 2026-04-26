import { Link } from "react-router-dom";

export const CaicMark = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`inline-flex items-baseline gap-1 group ${className}`}>
    <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
      caic
    </span>
    <span className="h-1.5 w-1.5 rounded-full bg-primary translate-y-[-2px] transition-smooth group-hover:scale-125" />
  </Link>
);
