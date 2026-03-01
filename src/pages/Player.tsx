import { useParams, useNavigate } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Subtitles, Settings, Loader2, RefreshCw, Smartphone, Monitor } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, loading: titlesLoading } = useTitles();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLandscape, setIsLandscape] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const hideTimer = useRef<number>(0);

  const title = getById(id || "");
  const videoUrl = title?.video_url || "";

  // Realtime wallet balance
  useEffect(() => {
    let channel: any;
    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const uid = session.user.id;
      const { data } = await supabase.from("profiles").select("wallet").eq("user_id", uid).single();
      if (data) setWalletBalance(data.wallet);

      channel = supabase
        .channel("player-wallet")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${uid}` }, (payload) => {
          setWalletBalance((payload.new as any).wallet ?? 0);
        })
        .subscribe();
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const getErrorMessage = useCallback((code: number | undefined) => {
    switch (code) {
      case 1: return "Video loading was aborted.";
      case 2: return "A network error prevented the video from loading. The server may not allow direct playback.";
      case 3: return "The video format is not supported by your browser.";
      case 4: return "The video URL is not accessible or the server blocks direct playback.";
      default: return "Unable to play this video. The link may be broken or the server may block direct playback.";
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setVideoError(null);
    setRetryCount(0);

    const onTime = () => { setCurrentTime(v.currentTime); setProgress((v.currentTime / v.duration) * 100); };
    const onMeta = () => setDuration(v.duration);
    const onError = () => setVideoError(getErrorMessage(v.error?.code));
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onError);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onError);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
    };
  }, [title, retryCount, getErrorMessage]);

  const handleRetry = () => { setVideoError(null); setRetryCount(c => c + 1); };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const skip = (s: number) => { if (videoRef.current) videoRef.current.currentTime += s; };

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

  const toggleOrientation = () => {
    setIsLandscape(prev => !prev);
    // Try native screen orientation API on mobile
    try {
      if (!isLandscape && screen.orientation?.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      } else if (isLandscape && screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    } catch {}
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  if (titlesLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!title) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Not found</div>;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-background z-50 ${!isLandscape ? "flex items-center justify-center" : ""}`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      onClick={togglePlay}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {videoError ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6" onClick={e => e.stopPropagation()}>
          <p className="text-foreground text-lg font-semibold">Playback Error</p>
          <p className="text-muted-foreground text-sm max-w-md text-center">{videoError}</p>
          <p className="text-muted-foreground text-xs max-w-md text-center break-all">
            URL: {videoUrl.slice(0, 100)}{videoUrl.length > 100 ? "…" : ""}
          </p>
          <div className="flex gap-3 mt-2">
            <button onClick={handleRetry} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded font-semibold">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button onClick={() => navigate(-1)} className="bg-secondary text-foreground px-5 py-2 rounded font-semibold">Go Back</button>
          </div>
        </div>
      ) : (
        <>
          <video
            key={`${videoUrl}-${retryCount}`}
            ref={videoRef}
            autoPlay
            muted={muted}
            playsInline
            className={`${isLandscape ? "w-full h-full" : "w-auto h-[60vh] max-w-full"} object-contain`}
            src={videoUrl}
          />
          {buffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
        </>
      )}

      {/* Back button — always visible */}
      <button
        className="absolute top-4 left-4 z-[60] bg-background/60 rounded-full p-2 text-foreground hover:bg-background/80 transition"
        onClick={e => { e.stopPropagation(); navigate(-1); }}
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-background/80 to-transparent px-14 md:px-20 py-4 flex items-center justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={e => e.stopPropagation()}
      >
        <span className="text-sm md:text-base font-medium text-foreground truncate">{title.title}</span>
        <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
          UGX {walletBalance.toLocaleString()}
        </div>
      </div>

      {/* Bottom controls */}
      {!videoError && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-4 md:px-8 pb-6 pt-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-full h-1 bg-muted rounded-full mb-4 cursor-pointer group" onClick={seek}>
            <div className="h-full bg-primary rounded-full relative transition-all" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => skip(-10)}><SkipBack className="w-5 h-5 text-foreground" /></button>
              <button onClick={togglePlay}>
                {playing ? <Pause className="w-7 h-7 text-foreground" /> : <Play className="w-7 h-7 text-foreground fill-foreground" />}
              </button>
              <button onClick={() => skip(10)}><SkipForward className="w-5 h-5 text-foreground" /></button>
              <button onClick={() => setMuted(!muted)}>
                {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
              </button>
              <span className="text-xs text-muted-foreground">{fmt(currentTime)} / {fmt(duration)}</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleOrientation} title={isLandscape ? "Portrait mode" : "Landscape mode"}>
                {isLandscape ? <Smartphone className="w-5 h-5 text-foreground" /> : <Monitor className="w-5 h-5 text-foreground" />}
              </button>
              <button><Subtitles className="w-5 h-5 text-foreground" /></button>
              <button onClick={toggleFullscreen}>
                <Maximize className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
