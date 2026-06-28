import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MarqueeAd {
  id: string;
  text: string;
  font_size: number;
  font_family: string;
  font_color: string;
  background_color: string;
  speed: number;
}

interface MarqueeBarProps {
  variant?: "page" | "player";
}

export default function MarqueeBar({ variant = "page" }: MarqueeBarProps) {
  const [ads, setAds] = useState<MarqueeAd[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("marquee_ads")
        .select("id, text, font_size, font_family, font_color, background_color, speed")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setAds((data as unknown as MarqueeAd[]) || []);
    };
    fetch();

    const channel = supabase
      .channel("marquee-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "marquee_ads" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (ads.length === 0) return null;

  // Combine all active ads into a single scrolling ticker
  const combinedText = ads.map((a) => a.text).join("   •   ");
  // Use the first ad's styles as the primary style
  const primary = ads[0];

  const animationDuration = Math.max(10, Math.round((combinedText.length / primary.speed) * 10));

  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${
        variant === "player"
          ? "absolute bottom-0 left-0 right-0 z-30"
          : "fixed bottom-0 left-0 right-0 z-[9998]"
      }`}
      style={{
        backgroundColor: primary.background_color === "transparent" 
          ? (variant === "player" ? "rgba(0,0,0,0.6)" : "hsl(var(--secondary))") 
          : primary.background_color,
      }}
    >
      <div
        className="inline-block animate-marquee py-1.5 px-4"
        style={{
          fontSize: `${primary.font_size}px`,
          fontFamily: primary.font_family,
          color: primary.font_color,
          animationDuration: `${animationDuration}s`,
        }}
      >
        {ads.map((ad, i) => (
          <span key={ad.id} style={{
            fontSize: `${ad.font_size}px`,
            fontFamily: ad.font_family,
            color: ad.font_color,
          }}>
            {ad.text}
            {i < ads.length - 1 && (
              <span className="mx-6 opacity-40">•</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
