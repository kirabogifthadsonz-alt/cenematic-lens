import { ArrowLeft, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeraboxPlayerProps {
  url: string;
  title: string;
  wallet: number;
}

export default function TeraboxPlayer({ url, title: movieTitle, wallet }: TeraboxPlayerProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number>(0);

  // Try to extract direct MP4 URL via proxy
  useEffect(() => {
    let cancelled = false;
    const extract = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("terabox-proxy", {
          body: { url },
        });

        if (cancelled) return;

        if (error || !data?.videoUrl) {
          setBlocked(true);
          setLoading(false);
          return;
        }

        setDirectUrl(data.videoUrl);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setBlocked(true);
          setLoading(false);
        }
      }
    };
    extract();
    return () => { cancelled = true; };
  }, [url]);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setProgress((v.currentTime / v.duration) * 100);
    };
    const onMeta = () => setDuration(v.duration);
    const onError = () => {
      setVideoError(true);
      setBlocked(true);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onError);
    };
  }, [directUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const skip = (s: number) => {
    if (videoRef.current) videoRef.current.currentTime += s;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) videoRef.current.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 3000);
  };

  const openExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Preparing video…</p>
        </div>
      </div>
    );
  }

  // Blocked / fallback UI
  if (blocked) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-foreground hover:text-primary transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-sm md:text-base font-medium text-foreground truncate max-w-[200px] md:max-w-none">
              {movieTitle}
            </span>
          </div>
          <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
            UGX {wallet.toLocaleString()}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-foreground text-xl font-semibold mb-3">Opening Video Player</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This video will open in a secure player tab for the best streaming experience.
            </p>
            <button
              onClick={openExternal}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-base hover:bg-primary/90 transition w-full flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Watch Now
            </button>
            <button
              onClick={() => navigate(-1)}
              className="mt-3 text-muted-foreground hover:text-foreground text-sm transition w-full py-2"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Native HTML5 player with extracted direct URL
  return (
    <div
      className="fixed inset-0 bg-background z-50"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      onClick={togglePlay}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        className="w-full h-full object-contain"
        src={directUrl || ""}
        playsInline
      />

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-background/80 to-transparent px-4 md:px-8 py-4 flex items-center justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-sm md:text-base font-medium text-foreground">{movieTitle}</span>
        </div>
        <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
          UGX {wallet.toLocaleString()}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent px-4 md:px-8 pb-6 pt-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-1 bg-muted rounded-full mb-4 cursor-pointer group" onClick={seek}>
          <div className="h-full bg-primary rounded-full relative transition-all" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => skip(-10)}>
              <SkipBack className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={togglePlay}>
              {playing ? <Pause className="w-7 h-7 text-foreground" /> : <Play className="w-7 h-7 text-foreground fill-foreground" />}
            </button>
            <button onClick={() => skip(10)}>
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
            </button>
            <span className="text-xs text-muted-foreground">
              {fmt(currentTime)} / {fmt(duration || 0)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => videoRef.current?.requestFullscreen()}>
              <Maximize className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
