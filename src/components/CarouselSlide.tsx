import { useEffect, useRef } from "react";

export type VisualStyle =
  | "minimalista_editorial"
  | "quente_organico"
  | "moderno_geometrico"
  | "suave_pastel"
  | "sofisticado_escuro";

interface CarouselSlideProps {
  text: string;
  imageUrl: string;
  visualStyle: VisualStyle;
  slideIndex: number;
  onReady?: (slideIndex: number) => void;
  onImageError?: (slideIndex: number) => void;
  /** Allow rendering at a smaller size (preview). Default = 1 = 1080x1350. */
  scale?: number;
}

/** Slide dimensions: 1080x1350 (Instagram 4:5). */
export const SLIDE_W = 1080;
export const SLIDE_H = 1350;

interface StyleSpec {
  fontFamily: string;
  overlayColor: string;
  overlayOpacity: number;
  textColor: string;
  textAlign: "left" | "center" | "right";
  fontWeight: number;
  rotation?: number;
  letterSpacing?: string;
  padding: number;
}

const STYLES: Record<VisualStyle, StyleSpec> = {
  minimalista_editorial: {
    fontFamily: "'Fraunces', serif",
    overlayColor: "#FAF7F2",
    overlayOpacity: 0.65,
    textColor: "#0A0A0A",
    textAlign: "center",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    padding: 120,
  },
  quente_organico: {
    fontFamily: "'Caveat', cursive",
    overlayColor: "#8B6F47",
    overlayOpacity: 0.4,
    textColor: "#FFFFFF",
    textAlign: "center",
    fontWeight: 700,
    rotation: -2,
    padding: 100,
  },
  moderno_geometrico: {
    fontFamily: "'Inter', sans-serif",
    overlayColor: "#000000",
    overlayOpacity: 0.5,
    textColor: "#FFFFFF",
    textAlign: "left",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    padding: 90,
  },
  suave_pastel: {
    fontFamily: "'Nunito', sans-serif",
    overlayColor: "#F5D5D5",
    overlayOpacity: 0.6,
    textColor: "#4A4A4A",
    textAlign: "center",
    fontWeight: 800,
    padding: 110,
  },
  sofisticado_escuro: {
    fontFamily: "'Playfair Display', serif",
    overlayColor: "#000000",
    overlayOpacity: 0.65,
    textColor: "#D4A574",
    textAlign: "center",
    fontWeight: 700,
    letterSpacing: "0.01em",
    padding: 110,
  },
};

/**
 * Decide se a imagem precisa passar pelo image-proxy edge function
 * (CORS taint impede html-to-image de capturar imagens externas).
 * Imagens do nosso próprio Supabase Storage não precisam.
 */
function resolveImageUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url, window.location.origin);
    const host = u.hostname;
    // Imagens do mesmo origin ou do Supabase Storage do projeto → direto
    if (host === window.location.hostname) return url;
    if (host.endsWith(".supabase.co")) return url;
    // Externas → proxy
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const proxyBase = `https://${projectId}.supabase.co/functions/v1/image-proxy`;
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

export function CarouselSlide({
  text,
  imageUrl,
  visualStyle,
  slideIndex,
  onReady,
  onImageError,
  scale = 1,
}: CarouselSlideProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const style = STYLES[visualStyle] ?? STYLES.minimalista_editorial;
  const resolvedUrl = resolveImageUrl(imageUrl);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      onReady?.(slideIndex);
    }
  }, [slideIndex, onReady, resolvedUrl]);

  // Tamanho real do frame de exportação (sempre 1080x1350) — escala apenas o wrapper.
  const fontSize = Math.round(SLIDE_W * (style.textAlign === "left" ? 0.075 : 0.085));

  return (
    <div
      style={{
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: "top left",
        width: SLIDE_W,
        height: SLIDE_H,
      }}
    >
      <div
        data-slide-frame={slideIndex}
        style={{
          position: "relative",
          width: `${SLIDE_W}px`,
          height: `${SLIDE_H}px`,
          overflow: "hidden",
          backgroundColor: "#1a1a1a",
        }}
      >
        {resolvedUrl ? (
          <img
            ref={imgRef}
            src={resolvedUrl}
            alt=""
            crossOrigin="anonymous"
            onLoad={() => onReady?.(slideIndex)}
            onError={() => onImageError?.(slideIndex)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: style.overlayColor,
            opacity: style.overlayOpacity,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent:
              style.textAlign === "left"
                ? "flex-start"
                : style.textAlign === "right"
                  ? "flex-end"
                  : "center",
            padding: `${style.padding}px`,
          }}
        >
          <p
            style={{
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              color: style.textColor,
              textAlign: style.textAlign,
              fontSize: `${fontSize}px`,
              lineHeight: 1.2,
              letterSpacing: style.letterSpacing,
              margin: 0,
              transform: style.rotation ? `rotate(${style.rotation}deg)` : undefined,
              maxWidth: "100%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
