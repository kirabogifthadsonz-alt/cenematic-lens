import { useEffect, useRef, useState } from "react";

const INTRO_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/videos/logo-intro.mp4`;

interface LogoIntroPlayerProps {
  /** Called when the intro finishes playing */
  onComplete: () => void;
  /** Hidden video ref for the main movie — caller can start preloading it */
  mainVideoRef?: React.RefObject<HTMLVideoElement>;
}

export default function LogoIntroPlayer({ onComplete }: LogoIntroPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  // Check if logo intro is enabled
  useEffect(() => {
    const checkEnabled = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const client = createClient(url, key);
        const { data } = await client
          .from("logo_intro_settings")
          .select("is_enabled")
          .eq("id", 1)
          .maybeSingle();
        if (data && !data.is_enabled) {
          setEnabled(false);
          onComplete();
        } else {
          setEnabled(true);
        }
      } catch {
        setEnabled(true);
      }
    };
    checkEnabled();
  }, [onComplete]);

  useEffect(() => {
    if (enabled !== true) return;
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => onComplete();
    const handleError = () => {
      console.warn("Logo intro failed to load, skipping");
      onComplete();
    };
    const handleTimeUpdate = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };

    v.addEventListener("ended", handleEnded);
    v.addEventListener("error", handleError);
    v.addEventListener("timeupdate", handleTimeUpdate);

    v.play().catch(() => {
      onComplete();
    });

    return () => {
      v.removeEventListener("ended", handleEnded);
      v.removeEventListener("error", handleError);
      v.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [onComplete, enabled]);

  if (enabled !== true) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={INTRO_URL}
        className="w-full h-full object-contain"
        playsInline
        muted={false}
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
        style={{ pointerEvents: "none" }}
      />
      {/* Thin progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full transition-all duration-200"
          style={{ width: `${progress}%`, background: "hsl(var(--primary))", boxShadow: "0 0 8px hsl(var(--primary) / 0.6)" }}
        />
      </div>
    </div>
  );
}
