import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnimationType = "none" | "fadeIn" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "zoomIn" | "bounce" | "flipIn" | "popUp" | "shake" | "rotate" | "elastic" | "swing" | "rubberBand" | "jello" | "heartbeat" | "flash";
export type FilterPreset = "none" | "grayscale" | "sepia" | "blur" | "brightness" | "contrast" | "hueRotate" | "saturate" | "invert";

export interface LowerThirdLayer {
  id: string;
  type: "text" | "image" | "shape" | "marquee" | "sticker";
  x: number;
  y: number;
  width: number;
  height: number;
  // Animation
  entranceAnimation?: AnimationType;
  exitAnimation?: AnimationType;
  animationDuration?: number; // seconds
  animationDelay?: number; // seconds
  animationSpeed?: number; // multiplier: 0.25 to 3
  // Per-layer timing (offset within ad)
  layerStartOffset?: number; // seconds from ad start
  layerEndOffset?: number; // seconds from ad start (0 = full duration)
  // Text props
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  textShadow?: string;
  // Image props
  url?: string;
  objectFit?: "cover" | "contain" | "fill";
  borderRadius?: number;
  // Image filters
  filterPreset?: FilterPreset;
  filterBrightness?: number;
  filterContrast?: number;
  filterBlur?: number;
  filterHueRotate?: number;
  filterSaturate?: number;
  filterGrayscale?: number;
  // Shape props
  shape?: "rect" | "circle";
  backgroundColor?: string;
  opacity?: number;
  // Marquee props
  speed?: number;
  // Sticker props
  sticker?: string; // emoji or URL
  stickerRotation?: number;
  stickerScale?: number;
}

interface LowerThirdAd {
  id: string;
  title: string;
  is_enabled: boolean;
  start_time_seconds: number;
  end_time_seconds: number;
  height_percent: number;
  background_color: string;
  background_opacity: number;
  layers: LowerThirdLayer[];
}

interface LowerThirdOverlayProps {
  currentTime: number;
  isPlaying: boolean;
}

const ANIMATION_KEYFRAMES: Record<AnimationType, string> = {
  none: "",
  fadeIn: "lt-fadeIn",
  slideLeft: "lt-slideLeft",
  slideRight: "lt-slideRight",
  slideUp: "lt-slideUp",
  slideDown: "lt-slideDown",
  zoomIn: "lt-zoomIn",
  bounce: "lt-bounce",
  flipIn: "lt-flipIn",
  popUp: "lt-popUp",
  shake: "lt-shake",
  rotate: "lt-rotate",
  elastic: "lt-elastic",
  swing: "lt-swing",
  rubberBand: "lt-rubberBand",
  jello: "lt-jello",
  heartbeat: "lt-heartbeat",
  flash: "lt-flash",
};

const EXIT_ANIMATION_KEYFRAMES: Record<AnimationType, string> = {
  none: "",
  fadeIn: "lt-fadeOut",
  slideLeft: "lt-slideOutLeft",
  slideRight: "lt-slideOutRight",
  slideUp: "lt-slideOutUp",
  slideDown: "lt-slideOutDown",
  zoomIn: "lt-zoomOut",
  bounce: "lt-bounceOut",
  flipIn: "lt-flipOut",
  popUp: "lt-popOut",
  shake: "lt-fadeOut",
  rotate: "lt-rotateOut",
  elastic: "lt-zoomOut",
  swing: "lt-fadeOut",
  rubberBand: "lt-fadeOut",
  jello: "lt-fadeOut",
  heartbeat: "lt-fadeOut",
  flash: "lt-fadeOut",
};

function getFilterStyle(layer: LowerThirdLayer): string {
  if (layer.filterPreset && layer.filterPreset !== "none") {
    const presets: Record<string, string> = {
      grayscale: "grayscale(100%)",
      sepia: "sepia(100%)",
      blur: "blur(3px)",
      brightness: "brightness(1.4)",
      contrast: "contrast(1.5)",
      hueRotate: "hue-rotate(90deg)",
      saturate: "saturate(2)",
      invert: "invert(100%)",
    };
    return presets[layer.filterPreset] || "";
  }
  const parts: string[] = [];
  if (layer.filterBrightness !== undefined && layer.filterBrightness !== 100) parts.push(`brightness(${layer.filterBrightness / 100})`);
  if (layer.filterContrast !== undefined && layer.filterContrast !== 100) parts.push(`contrast(${layer.filterContrast / 100})`);
  if (layer.filterBlur !== undefined && layer.filterBlur > 0) parts.push(`blur(${layer.filterBlur}px)`);
  if (layer.filterHueRotate !== undefined && layer.filterHueRotate !== 0) parts.push(`hue-rotate(${layer.filterHueRotate}deg)`);
  if (layer.filterSaturate !== undefined && layer.filterSaturate !== 100) parts.push(`saturate(${layer.filterSaturate / 100})`);
  if (layer.filterGrayscale !== undefined && layer.filterGrayscale > 0) parts.push(`grayscale(${layer.filterGrayscale / 100})`);
  return parts.join(" ");
}

export default function LowerThirdOverlay({ currentTime, isPlaying }: LowerThirdOverlayProps) {
  const [ads, setAds] = useState<LowerThirdAd[]>([]);
  const [activeAd, setActiveAd] = useState<LowerThirdAd | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const prevAdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from("lower_third_ads")
        .select("*")
        .eq("is_enabled", true)
        .order("start_time_seconds", { ascending: true });
      if (data) {
        setAds(data.map((d: any) => ({
          ...d,
          layers: Array.isArray(d.layers) ? d.layers : JSON.parse(d.layers || "[]"),
        })));
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (!isPlaying || ads.length === 0) {
      if (activeAd) setIsExiting(true);
      const timeout = setTimeout(() => { setActiveAd(null); setIsExiting(false); }, 500);
      return () => clearTimeout(timeout);
    }
    const match = ads.find(
      (ad) => currentTime >= ad.start_time_seconds && currentTime <= ad.end_time_seconds
    );
    if (match && match.id !== prevAdRef.current) {
      setIsExiting(false);
      setActiveAd(match);
      prevAdRef.current = match.id;
    } else if (!match && activeAd) {
      setIsExiting(true);
      setTimeout(() => { setActiveAd(null); setIsExiting(false); prevAdRef.current = null; }, 500);
    }
  }, [currentTime, isPlaying, ads]);

  if (!activeAd) return null;

  const heightPct = activeAd.height_percent || 25;
  const adElapsed = currentTime - activeAd.start_time_seconds;

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 pointer-events-none ${isExiting ? "lt-slideOutDown" : "lt-slideUp"}`}
      style={{ height: `${heightPct}%`, animationDuration: "0.5s", animationFillMode: "both" }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: activeAd.background_color, opacity: activeAd.background_opacity }}
      />
      <div className="absolute inset-0 overflow-hidden">
        {activeAd.layers.map((layer) => (
          <LayerRenderer key={layer.id} layer={layer} adElapsed={adElapsed} adDuration={activeAd.end_time_seconds - activeAd.start_time_seconds} isExiting={isExiting} />
        ))}
      </div>
    </div>
  );
}

function LayerRenderer({ layer, adElapsed, adDuration, isExiting }: { layer: LowerThirdLayer; adElapsed: number; adDuration: number; isExiting: boolean }) {
  const layerStart = layer.layerStartOffset || 0;
  const layerEnd = layer.layerEndOffset || 0;
  const effectiveEnd = layerEnd > 0 ? layerEnd : adDuration;
  
  // Hide layer if outside its timing window
  if (adElapsed < layerStart || adElapsed > effectiveEnd) return null;

  const entranceAnim = layer.entranceAnimation || "none";
  const exitAnim = layer.exitAnimation || "none";
  const baseDuration = layer.animationDuration || 0.5;
  const speedMultiplier = layer.animationSpeed || 1;
  const duration = baseDuration / speedMultiplier;
  const delay = layer.animationDelay || 0;

  const isLayerExiting = isExiting || (effectiveEnd - adElapsed < duration);
  const animClass = isLayerExiting
    ? EXIT_ANIMATION_KEYFRAMES[exitAnim] || ""
    : ANIMATION_KEYFRAMES[entranceAnim] || "";

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.width}%`,
    height: `${layer.height}%`,
    opacity: layer.opacity ?? 1,
    animationDuration: `${duration}s`,
    animationDelay: isLayerExiting ? "0s" : `${delay}s`,
    animationFillMode: "both",
  };

  if (layer.type === "text") {
    return (
      <div className={animClass} style={{
        ...baseStyle,
        fontSize: `${layer.fontSize || 16}px`,
        fontFamily: layer.fontFamily || "Inter, sans-serif",
        color: layer.color || "#ffffff",
        fontWeight: layer.bold ? "bold" : "normal",
        fontStyle: layer.italic ? "italic" : "normal",
        textAlign: layer.textAlign || "left",
        textShadow: layer.textShadow || undefined,
        display: "flex", alignItems: "center", lineHeight: 1.2,
        padding: "2px 4px", overflow: "hidden", whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {layer.content}
      </div>
    );
  }

  if (layer.type === "image") {
    const filterStr = getFilterStyle(layer);
    return (
      <div className={`overflow-hidden ${animClass}`} style={baseStyle}>
        <img src={layer.url} alt="" className="w-full h-full" style={{
          objectFit: layer.objectFit || "contain",
          borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
          filter: filterStr || undefined,
        }} />
      </div>
    );
  }

  if (layer.type === "shape") {
    return (
      <div className={animClass} style={{
        ...baseStyle,
        backgroundColor: layer.backgroundColor || "#ffffff",
        opacity: layer.opacity ?? 0.5,
        borderRadius: layer.shape === "circle" ? "50%" : `${layer.borderRadius || 0}px`,
      }} />
    );
  }

  if (layer.type === "marquee") {
    return <MarqueeLayer layer={layer} style={baseStyle} animClass={animClass} />;
  }

  if (layer.type === "sticker") {
    return (
      <div className={animClass} style={{
        ...baseStyle,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: `${(layer.stickerScale || 1) * 40}px`,
        transform: `rotate(${layer.stickerRotation || 0}deg)`,
      }}>
        {layer.sticker || "⭐"}
      </div>
    );
  }

  return null;
}

function MarqueeLayer({ layer, style, animClass }: { layer: LowerThirdLayer; style: React.CSSProperties; animClass: string }) {
  const speed = layer.speed || 50;
  return (
    <div className={animClass} style={{ ...style, overflow: "hidden" }}>
      <div
        className="animate-marquee whitespace-nowrap"
        style={{
          fontSize: `${layer.fontSize || 14}px`,
          fontFamily: layer.fontFamily || "Inter, sans-serif",
          color: layer.color || "#ffffff",
          fontWeight: layer.bold ? "bold" : "normal",
          animationDuration: `${Math.max(5, 150 / speed * 10)}s`,
          lineHeight: 1, display: "flex", alignItems: "center", height: "100%",
        }}
      >
        {layer.content}
      </div>
    </div>
  );
}

export type { LowerThirdAd };
