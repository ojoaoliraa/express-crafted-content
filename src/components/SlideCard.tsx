import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SlideCardProps {
  index: number;
  total: number;
  /** Texto principal do slide (vem do CAIC) */
  text: string;
  /** cover | content | cta */
  kind: string;
  imageUrl?: string | null;
  /** preview = responsive aspect-square; render = exato 1080x1080 pra PNG */
  variant?: "preview" | "render";
  className?: string;
}

const ACCENT = "#D4A574"; // dourado quente — identidade CAIC
const TEXT_SHADOW = "0 2px 8px rgba(0,0,0,0.6)";

/**
 * Card de slide do CAIC.
 * - Tipografia: Fraunces (display) + Inter (UI/marca).
 * - Layout varia por kind + paridade do índice (cover top-left, content alterna lados, central centralizado, cta centralizado).
 * - Scrim duplo (top->bottom) sobre toda imagem garante legibilidade.
 * - Marca @caic (bottom-right) + indicador X/N (bottom-left) em todos os slides.
 */
export const SlideCard = forwardRef<HTMLDivElement, SlideCardProps>(
  ({ index, total, text, kind, imageUrl, variant = "preview", className }, ref) => {
    const isRender = variant === "render";

    // Fundo sem imagem: gradiente sutil em vez de preto liso.
    const baseBg = imageUrl
      ? "#0a0a0a"
      : "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)";

    // Layout por slide
    const isCover = kind === "cover";
    const isCta = kind === "cta";
    const isContent = !isCover && !isCta;
    const middleIndex = Math.ceil(total / 2);
    const isCentralContent = isContent && index === middleIndex;
    const isOdd = index % 2 === 1;

    // Posicionamento do bloco de texto
    let textPlacement = "items-center justify-center text-center";
    if (isCover) textPlacement = "items-start justify-start text-left";
    else if (isCta) textPlacement = "items-center justify-center text-center";
    else if (isCentralContent) textPlacement = "items-center justify-center text-center";
    else if (isOdd) textPlacement = "items-start justify-end text-left"; // bottom-left
    else textPlacement = "items-end justify-end text-right"; // bottom-right

    // Escala tipográfica (render usa px fixos pra PNG nítido)
    const coverPx = isRender ? { fontSize: 120, lineHeight: 1.02 } : undefined;
    const contentPx = isRender ? { fontSize: 64, lineHeight: 1.15 } : undefined;
    const ctaPx = isRender ? { fontSize: 96, lineHeight: 1.05 } : undefined;

    const padding = isRender ? "p-24" : "p-7";

    // Label de marca (Inter, uppercase tracking)
    const brandFont: React.CSSProperties = {
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    };
    const displayFont: React.CSSProperties = {
      fontFamily: "'Fraunces', ui-serif, Georgia, serif",
      textShadow: imageUrl ? TEXT_SHADOW : "none",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden text-background rounded-2xl",
          isRender ? "w-[1080px] h-[1080px]" : "aspect-square w-full",
          className,
        )}
        style={{
          ...(isRender ? { width: 1080, height: 1080 } : {}),
          background: baseBg,
        }}
      >
        {/* Imagem de fundo + scrim duplo */}
        {imageUrl && (
          <>
            <img
              src={imageUrl}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
              }}
            />
          </>
        )}

        {/* Conteúdo */}
        <div className={cn("relative h-full w-full flex flex-col", padding)}>
          {/* Bloco principal */}
          <div className={cn("flex-1 flex w-full", textPlacement)}>
            {isCentralContent && !imageUrl ? (
              // Caixa translúcida para slide central de conteúdo (texto puro)
              <div
                className={cn(
                  "rounded-xl backdrop-blur-sm",
                  isRender ? "px-16 py-12 max-w-[820px]" : "px-5 py-4 max-w-[85%]",
                )}
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <SlideText
                  isCover={false}
                  isCta={false}
                  kind={kind}
                  text={text}
                  px={contentPx}
                  isRender={isRender}
                  displayFont={displayFont}
                  brandFont={brandFont}
                />
              </div>
            ) : (
              <div className={cn(isCover ? "max-w-[90%]" : "max-w-[88%]")}>
                {/* Linha decorativa accent acima de slides sem imagem */}
                {!imageUrl && !isCover && (
                  <div
                    className={cn("mb-4", isRender ? "h-[2px] w-[120px] mb-8" : "h-[1px] w-[60px]")}
                    style={{ background: ACCENT }}
                  />
                )}
                <SlideText
                  isCover={isCover}
                  isCta={isCta}
                  kind={kind}
                  text={text}
                  px={isCover ? coverPx : isCta ? ctaPx : contentPx}
                  isRender={isRender}
                  displayFont={displayFont}
                  brandFont={brandFont}
                />

                {/* Botão CTA */}
                {isCta && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-3 rounded-full",
                      isRender ? "mt-12 px-10 py-5 text-3xl" : "mt-5 px-5 py-2.5 text-sm",
                    )}
                    style={{
                      background: ACCENT,
                      color: "#0a0a0a",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    <span>link na bio</span>
                    <span aria-hidden>→</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé: índice + marca */}
          <div
            className={cn(
              "flex items-end justify-between w-full",
              isRender ? "mt-12 text-2xl" : "mt-4 text-[10px]",
            )}
          >
            <span
              style={{
                ...brandFont,
                color: ACCENT,
                opacity: 0.8,
                fontWeight: 500,
                letterSpacing: "0.08em",
              }}
            >
              {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <span
              style={{
                ...brandFont,
                color: ACCENT,
                opacity: 0.8,
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              @caic
            </span>
          </div>
        </div>
      </div>
    );
  },
);

SlideCard.displayName = "SlideCard";

/* ---------------- Sub-componente: bloco de texto ---------------- */

function SlideText({
  isCover,
  isCta,
  kind,
  text,
  px,
  isRender,
  displayFont,
  brandFont,
}: {
  isCover: boolean;
  isCta: boolean;
  kind: string;
  text: string;
  px?: React.CSSProperties;
  isRender: boolean;
  displayFont: React.CSSProperties;
  brandFont: React.CSSProperties;
}) {
  // Detecta labels do tipo "Mito: ...", "Verdade: ..."
  const labelMatch = !isCover && !isCta ? text.match(/^([^:]{2,15}):\s*(.+)$/s) : null;

  if (labelMatch) {
    const [, label, rest] = labelMatch;
    return (
      <>
        <div
          style={{
            ...brandFont,
            color: ACCENT,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: isRender ? 28 : 12,
            marginBottom: isRender ? 24 : 10,
          }}
        >
          {label}
        </div>
        <p
          className={cn(
            "tracking-tight font-medium",
            isCover
              ? "text-5xl md:text-7xl"
              : isCta
                ? "text-5xl md:text-7xl"
                : "text-2xl md:text-3xl",
          )}
          style={{ ...displayFont, ...px, fontWeight: 500 }}
        >
          {rest}
        </p>
      </>
    );
  }

  return (
    <p
      className={cn(
        "tracking-tight",
        isCover
          ? "text-5xl md:text-7xl font-semibold"
          : isCta
            ? "text-5xl md:text-7xl font-semibold"
            : "text-2xl md:text-3xl font-medium",
      )}
      style={{
        ...displayFont,
        ...px,
        fontWeight: isCover || isCta ? 600 : 500,
        lineHeight: isCover || isCta ? 1.05 : 1.2,
      }}
    >
      {text}
    </p>
  );
}
