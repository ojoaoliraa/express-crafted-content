import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SlideCardProps {
  index: number;
  total: number;
  title: string;
  body: string;
  kind: string; // cover | content | cta
  imageUrl?: string | null;
  variant?: "preview" | "render"; // render = exact 1080
  className?: string;
}

/**
 * Card renderizável: usado tanto pra preview (responsive)
 * quanto pra render exato 1080x1080 que vira PNG.
 */
export const SlideCard = forwardRef<HTMLDivElement, SlideCardProps>(
  ({ index, total, title, body, kind, imageUrl, variant = "preview", className }, ref) => {
    const isRender = variant === "render";
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-foreground text-background",
          isRender ? "w-[1080px] h-[1080px]" : "aspect-square w-full",
          "rounded-2xl",
          className,
        )}
        style={isRender ? { width: 1080, height: 1080 } : undefined}
      >
        {imageUrl && (
          <>
            <img
              src={imageUrl}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-foreground/10" />
          </>
        )}

        <div
          className={cn(
            "relative h-full w-full flex flex-col justify-between",
            isRender ? "p-20" : "p-6",
          )}
        >
          <div className="flex items-center justify-between text-background/70">
            <span
              className={cn(
                "font-mono uppercase tracking-widest",
                isRender ? "text-2xl" : "text-[10px]",
              )}
            >
              CAIC
            </span>
            <span
              className={cn(
                "font-mono",
                isRender ? "text-2xl" : "text-[10px]",
              )}
            >
              {index}/{total}
            </span>
          </div>

          <div className="space-y-4">
            <h2
              className={cn(
                "font-display leading-[1.05] tracking-tight",
                isRender ? "text-7xl" : "text-2xl",
              )}
              style={isRender ? { fontSize: 84, lineHeight: 1.05 } : undefined}
            >
              {title}
            </h2>
            <p
              className={cn(
                "text-background/85 leading-relaxed",
                isRender ? "text-4xl" : "text-sm",
              )}
              style={isRender ? { fontSize: 36, lineHeight: 1.45 } : undefined}
            >
              {body}
            </p>
          </div>

          <div className={cn("text-background/60", isRender ? "text-xl" : "text-[10px]")}>
            {kind === "cover" ? "↓ desliza" : kind === "cta" ? "→ link na bio" : ""}
          </div>
        </div>
      </div>
    );
  },
);

SlideCard.displayName = "SlideCard";
