import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseTelegramUrl } from "@/lib/video-utils";

interface TelegramPlayerProps {
  url: string;
  title: string;
  wallet: number;
}

export default function TelegramPlayer({ url, title: movieTitle, wallet }: TelegramPlayerProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    const fetchVideo = async () => {
      const parsed = parseTelegramUrl(url);
      if (!parsed) {
        setError("Invalid Telegram URL format");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("telegram-video", {
          body: { chatId: parsed.chatId, messageId: parsed.messageId },
        });

        if (cancelled) return;

        // Check if we got an error response (JSON)
        if (fnError) {
          setError(fnError.message || "Failed to fetch video");
          setLoading(false);
          return;
        }

        // If data is a Blob/ArrayBuffer (video stream), create object URL
        if (data instanceof Blob) {
          const blobUrl = URL.createObjectURL(data);
          setVideoBlob(blobUrl);
          setLoading(false);
          return;
        }

        // If data is JSON with error
        if (data?.error) {
          if (data.error === 'file_too_large') {
            setError(`Video is too large (${Math.round(data.fileSize / 1024 / 1024)}MB). Telegram Bot API supports up to 20MB.`);
          } else {
            setError(data.error);
          }
          setLoading(false);
          return;
        }

        setError("Unexpected response from server");
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load video from Telegram");
          setLoading(false);
        }
      }
    };

    fetchVideo();
    return () => {
      cancelled = true;
      if (videoBlob) URL.revokeObjectURL(videoBlob);
    };
  }, [url]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setProgress((v.currentTime / v.duration) * 100);
    };
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [videoBlob]);

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading from Telegram…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-foreground">
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
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-foreground text-xl font-semibold mb-3">Unable to Play</h2>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-base hover:bg-primary/90 transition w-full"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        src={videoBlob || ""}
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
