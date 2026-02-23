import { useParams, useNavigate } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { useStore } from "@/lib/store";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Subtitles, Settings, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, loading: titlesLoading } = useTitles();
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

  const title = getById(id || "");

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
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("loadedmetadata", onMeta); v.removeEventListener("error", onError); };
  }, [title]);

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

  if (titlesLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!title) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Not found</div>;

  return (
    <div
      className="fixed inset-0 bg-background z-50"
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {videoError ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <p className="text-foreground text-lg">Unable to play this video</p>
          <p className="text-muted-foreground text-sm max-w-md text-center">The video URL may not be accessible. Try a direct MP4 link.</p>
          <button onClick={() => navigate(-1)} className="bg-primary text-primary-foreground px-6 py-2 rounded font-semibold">Go Back</button>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted={muted}
          className="w-full h-full object-contain"
          src={title.video_url}
          crossOrigin="anonymous"
        />
      )}

      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 gradient-cinema-top px-4 md:px-8 py-4 flex items-center justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
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
      {!videoError && (
        <div className={`absolute bottom-0 left-0 right-0 gradient-cinema px-4 md:px-8 pb-6 pt-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
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
              <button><Subtitles className="w-5 h-5 text-foreground" /></button>
              <button><Settings className="w-5 h-5 text-foreground" /></button>
              <button onClick={() => videoRef.current?.requestFullscreen()}>
                <Maximize className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
