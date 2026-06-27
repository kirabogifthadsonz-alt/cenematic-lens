import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";


interface SqueezeBackAd {
  id: string;
  image_url: string;
  link_url: string | null;
  image_url_bottom: string | null;
  link_url_bottom: string | null;
  title: string;
  interval_minutes: number;
  duration_seconds: number;
  width_percent: number;
  height_percent: number;
  fit_left: string;
  fit_bottom: string;
}

interface SqueezeBackOverlayProps {
  currentTime: number;
  isPlaying: boolean;
  onSqueezeActive: (active: boolean, widthPercent?: number, heightPercent?: number) => void;
}

export default function SqueezeBackOverlay({ currentTime, isPlaying, onSqueezeActive }: SqueezeBackOverlayProps) {
  const [ads, setAds] = useState<SqueezeBackAd[]>([]);
  const [activeAd, setActiveAd] = useState<SqueezeBackAd | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastTriggerRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const adIndexRef = useRef(0);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from("squeeze_back_ads")
        .select("id, image_url, link_url, image_url_bottom, link_url_bottom, title, interval_minutes, duration_seconds, width_percent, height_percent, fit_left, fit_bottom")
        .eq("is_enabled", true)
        .order("created_at", { ascending: false });
      setAds((data as SqueezeBackAd[]) || []);
    };
    fetchAds();
  }, []);

  const showAd = useCallback((ad: SqueezeBackAd) => {
    setActiveAd(ad);
    setDismissed(false);
    onSqueezeActive(true, ad.width_percent || 40, ad.height_percent || 30);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveAd(null);
      onSqueezeActive(false);
    }, ad.duration_seconds * 1000);
  }, [onSqueezeActive]);

  useEffect(() => {
    if (!isPlaying || ads.length === 0 || dismissed) return;

    const intervalSeconds = (ads[0]?.interval_minutes || 20) * 60;
    const elapsed = currentTime - lastTriggerRef.current;

    if (currentTime >= intervalSeconds && elapsed >= intervalSeconds && !activeAd) {
      lastTriggerRef.current = currentTime;
      const ad = ads[adIndexRef.current % ads.length];
      adIndexRef.current++;
      showAd(ad);
    }
  }, [currentTime, isPlaying, ads, activeAd, dismissed, showAd]);

  // No manual dismiss — auto-dismiss only via duration timer

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!activeAd) return null;

  const widthPct = activeAd.width_percent || 40;
  const heightPct = activeAd.height_percent || 30;
  const leftFit = activeAd.fit_left === "contain" ? "object-contain" : "object-cover";
  const bottomFit = activeAd.fit_bottom === "contain" ? "object-contain" : "object-cover";

  return (
    <>

      {/* Left side ad — full height left strip */}
      <div
        className="absolute left-0 top-0 z-40 flex flex-col overflow-hidden bg-black/90 animate-in slide-in-from-left duration-500"
        style={{
          width: `${widthPct}%`,
          height: `100%`,
        }}
      >
        <div className="flex-1 min-h-0 flex items-center justify-center p-1 overflow-hidden">
          {activeAd.link_url ? (
            <a href={activeAd.link_url} target="_blank" rel="noopener noreferrer" className="w-full h-full overflow-hidden">
              <img src={activeAd.image_url} alt={activeAd.title + " - Left"} className={`w-full h-full ${leftFit} rounded-lg`} />
            </a>
          ) : (
            <img src={activeAd.image_url} alt={activeAd.title + " - Left"} className={`w-full h-full ${leftFit} rounded-lg`} />
          )}
        </div>
        <p className="text-[8px] text-center text-white/40 pb-0.5 shrink-0">Ad • {activeAd.title}</p>
      </div>

      {/* Bottom ad — fills space under the video (right of left ad) */}
      <div
        className="absolute bottom-0 z-40 flex flex-col overflow-hidden bg-black/90 animate-in slide-in-from-bottom duration-500"
        style={{
          left: `${widthPct}%`,
          width: `${100 - widthPct}%`,
          height: `${heightPct}%`,
        }}
      >
        <div className="flex-1 min-h-0 flex items-center justify-center p-1 overflow-hidden">
          {activeAd.image_url_bottom ? (
            activeAd.link_url_bottom ? (
              <a href={activeAd.link_url_bottom} target="_blank" rel="noopener noreferrer" className="w-full h-full overflow-hidden">
                <img src={activeAd.image_url_bottom} alt={activeAd.title + " - Bottom"} className={`w-full h-full ${bottomFit} rounded-lg`} />
              </a>
            ) : (
              <img src={activeAd.image_url_bottom} alt={activeAd.title + " - Bottom"} className={`w-full h-full ${bottomFit} rounded-lg`} />
            )
          ) : (
            activeAd.link_url ? (
              <a href={activeAd.link_url} target="_blank" rel="noopener noreferrer" className="w-full h-full overflow-hidden">
                <img src={activeAd.image_url} alt={activeAd.title + " - Bottom"} className={`w-full h-full ${bottomFit} rounded-lg`} />
              </a>
            ) : (
              <img src={activeAd.image_url} alt={activeAd.title + " - Bottom"} className={`w-full h-full ${bottomFit} rounded-lg`} />
            )
          )}
        </div>
        <p className="text-[8px] text-center text-white/40 pb-0.5 shrink-0">Ad • {activeAd.title}</p>
      </div>
    </>
  );
}
