import { useParams, useNavigate } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { useStore } from "@/lib/store";
import { detectSource, getPlayableUrl, getGDriveEmbedUrl } from "@/lib/video-utils";
import TeraboxPlayer from "@/components/TeraboxPlayer";
import TelegramPlayer from "@/components/TelegramPlayer";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, loading } = useTitles();
  const title = getById(id || "");
  const { wallet } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const hideTimer = useRef<number>(0);

  const source = title ? detectSource(title.video_url) : "unknown";
  const videoUrl = title ? getPlayableUrl(title.video_url) : "";
  const gdriveEmbed = title && source === "gdrive" ? getGDriveEmbedUrl(title.video_url) : null;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setProgress((v.currentTime / v.duration) * 100);
    };
    const onMeta = () => setDuration(v.duration);
    const onError = () => setVideoError(true);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onError);
    };
  }, [videoUrl]);

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
    return <div className="fixed inset-0 bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!title) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Not found</div>;

  // === TELEGRAM: Proxy player ===
  if (source === "telegram") {
    return <TelegramPlayer url={title.video_url} title={title.title} wallet={wallet} />;
  }

  // === TERABOX: Dedicated iframe player ===
  if (source === "terabox") {
    return <TeraboxPlayer url={title.video_url} title={title.title} wallet={wallet} />;
  }

  // === GOOGLE DRIVE: iframe embed ===
  if ((videoError && gdriveEmbed) || (source === "gdrive" && gdriveEmbed)) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="absolute top-0 left-0 right-0 z-10 px-4 md:px-8 py-4 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-6 h-6" /></button>
            <span className="text-sm md:text-base font-medium text-foreground">{title.title}</span>
          </div>
          <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
            UGX {wallet.toLocaleString()}
          </div>
        </div>
        <iframe
          src={gdriveEmbed}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // === DIRECT MP4 / DROPBOX: HTML5 video player ===
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
        src={videoUrl}
        playsInline
      />

      {videoError && !gdriveEmbed && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center px-6">
            <p className="text-foreground text-lg mb-2">Unable to play this video</p>
            <p className="text-muted-foreground text-sm mb-4">The video source may be unavailable.</p>
            <button onClick={() => navigate(-1)} className="bg-primary text-primary-foreground px-6 py-2 rounded font-semibold">Go Back</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-background/80 to-transparent px-4 md:px-8 py-4 flex items-center justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-6 h-6" /></button>
          <span className="text-sm md:text-base font-medium text-foreground">{title.title}</span>
        </div>
        <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
          UGX {wallet.toLocaleString()}
        </div>
      </div>

      {/* Bottom controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent px-4 md:px-8 pb-6 pt-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
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
            <span className="text-xs text-muted-foreground">{fmt(currentTime)} / {fmt(duration || 0)}</span>
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
