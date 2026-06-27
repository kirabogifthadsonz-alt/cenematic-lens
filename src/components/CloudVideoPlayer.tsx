import { useEffect, useState, useRef, useCallback } from "react";
import Player from "@vimeo/player";
import { hasCdnProxy } from "@/lib/dropboxPreloader";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Play, Pause, Maximize, Minimize,
  Smartphone, ScreenShare, Loader2, Volume2, VolumeX,
  RotateCcw, RotateCw, WifiOff,
} from "lucide-react";
import { CloudVideoInfo } from "@/lib/cloudVideoDetect";
import { transformVideoUrl, detectVideoMime } from "@/lib/videoUrlTransform";
import { getBufferedSegmentEnd } from "@/lib/videoBuffering";
import SqueezeBackOverlay from "@/components/SqueezeBackOverlay";
import LowerThirdOverlay from "@/components/LowerThirdOverlay";

const PLAYER_ACCENT = "hsl(var(--player-accent))";
const BG = "hsl(var(--background))";

interface CloudVideoPlayerProps {
  movie: any;
  cloudInfo: CloudVideoInfo;
  onBack: () => void;
  recommendations?: any[];
  onPlayRecommended?: (movie: any) => void;
}

export default function CloudVideoPlayer({ movie, cloudInfo, onBack, recommendations = [], onPlayRecommended }: CloudVideoPlayerProps) {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [forcedLandscape, setForcedLandscape] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [videoError, setVideoError] = useState("");
  const [preloadPhase, setPreloadPhase] = useState(true); // Block UI until ready
  const [preloadPercent, setPreloadPercent] = useState(0);
  const [squeezeActive, setSqueezeActive] = useState(false);
  const [squeezeWidth, setSqueezeWidth] = useState(40);
  const [squeezeHeight, setSqueezeHeight] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);
  const autoImmersiveRef = useRef(false);

  const isMobileDevice = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

  // Some providers require iframe playback instead of a native <video>
  const useIframe = cloudInfo.useIframe;
  const isVimeo = cloudInfo.provider === "vimeo";

  // Build the best direct playable URL for native video
  const videoSrc = (() => {
    if (useIframe) return "";
    const raw = cloudInfo.downloadUrl || cloudInfo.embedUrl || cloudInfo.originalUrl;
    return transformVideoUrl(raw);
  })();

  const iframeSrc = useIframe ? cloudInfo.embedUrl || cloudInfo.originalUrl : "";
  const immersiveMode = isFullscreen || forcedLandscape;

  const clearControlsHide = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = undefined;
  }, []);

  const queueControlsHide = useCallback((shouldHide = isPlaying) => {
    clearControlsHide();
    if (!shouldHide) return;
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2000);
  }, [clearControlsHide, isPlaying]);

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));
    const nextMuted = safeVolume <= 0.01;
    setVolume(safeVolume);
    setIsMuted(nextMuted);

    if (isVimeo && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.setVolume(safeVolume).catch(() => undefined);
      vimeoPlayerRef.current.setMuted(nextMuted).catch(() => undefined);
      return;
    }

    if (!videoRef.current) return;
    videoRef.current.volume = safeVolume;
    videoRef.current.muted = nextMuted;
  }, [isVimeo]);

  const requestElementFullscreen = useCallback(async (element: HTMLElement | null) => {
    if (!element) return false;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        return true;
      }

      const webkitElement = element as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        webkitEnterFullscreen?: () => Promise<void> | void;
      };

      if (webkitElement.webkitRequestFullscreen) {
        await webkitElement.webkitRequestFullscreen();
        return true;
      }

      if (webkitElement.webkitEnterFullscreen) {
        await webkitElement.webkitEnterFullscreen();
        return true;
      }
    } catch {}

    return false;
  }, []);

  const exitElementFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      }

      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
      };

      if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
        return true;
      }
    } catch {}

    return false;
  }, []);

  const lockLandscape = useCallback(async () => {
    try {
      await (screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> })?.lock?.("landscape");
      return true;
    } catch {}

    return false;
  }, []);

  const unlockOrientation = useCallback(() => {
    try { screen.orientation?.unlock?.(); } catch {}
  }, []);

  useEffect(() => () => clearControlsHide(), [clearControlsHide]);

  useEffect(() => {
    if (!forcedLandscape || isFullscreen) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    window.scrollTo(0, 0);

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [forcedLandscape, isFullscreen]);

  useEffect(() => {
    if (!useIframe || !isVimeo || !iframeRef.current) return;

    const player = new Player(iframeRef.current);
    vimeoPlayerRef.current = player;
    let mounted = true;

    const handleLoaded = async () => {
      if (!mounted) return;
      const playerDuration = await player.getDuration().catch(() => 0);
      if (!mounted) return;
      setDuration(playerDuration || 0);
      setIsLoading(false);
      setPreloadPhase(false);
    };

    const handlePlay = () => {
      if (!mounted) return;
      setIsPlaying(true);
      setShowControls(true);
      setIsLoading(false);
      setIsBuffering(false);
      queueControlsHide(true);

      if (isMobileDevice && !autoImmersiveRef.current && !immersiveMode) {
        autoImmersiveRef.current = true;
        void enterFullscreen();
      }
    };

    const handlePause = () => {
      if (!mounted) return;
      setIsPlaying(false);
      setShowControls(true);
      queueControlsHide(false);
    };

    const handleTimeUpdate = (data: { seconds?: number; duration?: number; percent?: number }) => {
      if (!mounted) return;
      const seconds = data.seconds ?? 0;
      const totalDuration = data.duration ?? 0;
      const percent = (data.percent ?? 0) * 100;
      setCurrentTime(seconds);
      setDuration(totalDuration);
      setProgress(percent);
    };

    const handleProgress = (data: { percent?: number }) => {
      if (!mounted) return;
      setBufferedEnd((data.percent ?? 0) * 100);
    };

    const handleBufferStart = () => {
      if (!mounted) return;
      setIsBuffering(true);
    };

    const handleBufferEnd = () => {
      if (!mounted) return;
      setIsBuffering(false);
      setIsLoading(false);
    };

    const handleFullscreenChange = (data: { fullscreen?: boolean }) => {
      if (!mounted) return;
      setIsFullscreen(Boolean(data.fullscreen));
    };

    const handleError = () => {
      if (!mounted) return;
      setVideoError("Unable to play this video. Make sure the Vimeo link allows embedding.");
      setIsLoading(false);
      setPreloadPhase(false);
    };

    player.on("loaded", handleLoaded);
    player.on("play", handlePlay);
    player.on("pause", handlePause);
    player.on("timeupdate", handleTimeUpdate);
    player.on("progress", handleProgress);
    player.on("bufferstart", handleBufferStart);
    player.on("bufferend", handleBufferEnd);
    player.on("fullscreenchange", handleFullscreenChange);
    player.on("error", handleError);

    player.ready()
      .then(async () => {
        if (!mounted) return;
        setPreloadPhase(false);
        setIsLoading(false);
        await player.setAutopause(false).catch(() => undefined);
        await player.setMuted(isMuted).catch(() => undefined);
        await player.setVolume(volume).catch(() => undefined);
        const playerDuration = await player.getDuration().catch(() => 0);
        if (mounted) setDuration(playerDuration || 0);
        await player.play().catch(() => undefined);
      })
      .catch(handleError);

    return () => {
      mounted = false;
      player.off("loaded", handleLoaded);
      player.off("play", handlePlay);
      player.off("pause", handlePause);
      player.off("timeupdate", handleTimeUpdate);
      player.off("progress", handleProgress);
      player.off("bufferstart", handleBufferStart);
      player.off("bufferend", handleBufferEnd);
      player.off("fullscreenchange", handleFullscreenChange);
      player.off("error", handleError);
      player.destroy().catch(() => undefined);
      if (vimeoPlayerRef.current === player) vimeoPlayerRef.current = null;
    };
  }, [iframeSrc, immersiveMode, isMobileDevice, isMuted, isVimeo, queueControlsHide, useIframe, volume]);

  // Fullscreen handlers
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement || !!(document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        setForcedLandscape(false);
        unlockOrientation();
      }
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler as EventListener);
    };
  }, [unlockOrientation]);

  // Orientation tracking
  useEffect(() => {
    const update = () => setIsLandscape(
      screen.orientation?.type?.startsWith("landscape") ?? window.innerWidth > window.innerHeight
    );
    update();
    screen.orientation?.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      screen.orientation?.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Auto-enter fullscreen on landscape
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = () => {
      if (mq.matches && !document.fullscreenElement) enterFullscreen();
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Media session suppression
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = isPlaying
        ? (typeof MediaMetadata !== "undefined" ? new MediaMetadata({ title: " ", artist: "", album: "" }) : null)
        : null;
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "none";
    } catch {}
    return () => {
      try { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = "none"; } catch {};
    };
  }, [isPlaying]);

  useEffect(() => {
    setVideoError("");
    setIsBuffering(false);
    setIsPlaying(false);
    setBufferedEnd(0);
    setPreloadPhase(false);
    setPreloadPercent(100);
    setIsLoading(true);
  }, [useIframe, videoSrc, iframeSrc]);

  // Auto-play as soon as metadata is ready
  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPreloadPhase(false);
    setIsLoading(false);
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  // Aggressive background fetch: once playback starts, fetch the entire video
  // via a blob URL to prevent mid-playback buffering/stalls
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip blob fetch when CDN proxy is active — edge caching handles buffering
    if (useIframe || !videoSrc || preloadPhase || hasCdnProxy()) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const MAX_BLOB_BYTES = 500 * 1024 * 1024; // 500 MB cap

    const fetchFullVideo = async () => {
      try {
        // Use HEAD request first to check file size
        try {
          const head = await fetch(videoSrc, { method: "HEAD" });
          const contentLength = Number(head.headers.get("content-length") || 0);
          if (contentLength > MAX_BLOB_BYTES) {
            console.log(`[VideoPlayer] Video too large for blob cache (${(contentLength / 1024 / 1024).toFixed(0)} MB > 500 MB), using stream`);
            return;
          }
        } catch { /* HEAD not supported, proceed with GET and check during download */ }

        const res = await fetch(videoSrc);
        if (cancelled || !res.ok || !res.body) return;

        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          chunks.push(value);
          totalBytes += value.length;
          if (totalBytes > MAX_BLOB_BYTES) {
            console.log(`[VideoPlayer] Download exceeded 500 MB cap, aborting blob cache`);
            reader.cancel();
            return;
          }
        }

        if (cancelled) return;

        const blob = new Blob(chunks as BlobPart[], { type: detectVideoMime(videoSrc) });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        // Switch video source to the fully-downloaded blob
        const savedTime = video.currentTime;
        const wasPlaying = !video.paused;
        video.src = blobUrl;
        video.currentTime = savedTime;
        if (wasPlaying) video.play().catch(() => {});
        console.log(`[VideoPlayer] Full video cached in memory (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
      } catch (err) {
        // Silently fail — the stream-based source keeps working
        if (!cancelled) console.warn("[VideoPlayer] Background fetch failed, using stream", err);
      }
    };

    // Start fetching after a brief delay to not compete with initial buffering
    const timer = setTimeout(fetchFullVideo, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [useIframe, videoSrc, preloadPhase]);

  // Video element native attribute setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x-webkit-airplay", "allow");
    video.disablePictureInPicture = true;
    // Aggressive preloading
    video.preload = "auto";
    if ("disableRemotePlayback" in video) {
      try { (video as any).disableRemotePlayback = true; } catch {}
    }
  }, [videoSrc]);

  const enterFullscreen = async () => {
    const player = vimeoPlayerRef.current;
    const nativeTarget = videoRef.current ?? containerRef.current;

    if (isVimeo && player) {
      const iframeFullscreen = await player.requestFullscreen().then(() => true).catch(() => false);
      if (iframeFullscreen) {
        setIsFullscreen(true);
        await lockLandscape();
        return;
      }
    }

    const nativeFullscreen = await requestElementFullscreen(nativeTarget);
    if (nativeFullscreen) {
      setIsFullscreen(true);
      await lockLandscape();
      return;
    }

    if (isVimeo) {
      await requestElementFullscreen(containerRef.current);
      await lockLandscape();
      setForcedLandscape(true);
      return;
    }

    setForcedLandscape(true);
  };

  const exitFullscreen = async () => {
    if (isVimeo && vimeoPlayerRef.current) {
      await vimeoPlayerRef.current.exitFullscreen().catch(() => undefined);
    }

    await exitElementFullscreen();
    unlockOrientation();
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => (isFullscreen ? exitFullscreen() : enterFullscreen());

  const toggleOrientation = async () => {
    const nextForced = !forcedLandscape;

    if (nextForced) {
      setForcedLandscape(true);
      await enterFullscreen();
      await lockLandscape();
      return;
    }

    setForcedLandscape(false);
    await exitFullscreen();
  };

  const doubleTapRef = useRef<{ side: string; timer: ReturnType<typeof setTimeout> | null }>({ side: "", timer: null });
  const [seekIndicator, setSeekIndicator] = useState<"left" | "right" | null>(null);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    queueControlsHide();
  }, [queueControlsHide]);

  const handleDoubleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const side = x < rect.width / 2 ? "left" : "right";

    const dt = doubleTapRef.current;
    if (dt.timer && dt.side === side) {
      clearTimeout(dt.timer);
      dt.timer = null;
      dt.side = "";
      const v = videoRef.current;
      if (v) {
        v.currentTime += side === "left" ? -10 : 10;
        setSeekIndicator(side);
        setTimeout(() => setSeekIndicator(null), 600);
      }
    } else {
      if (dt.timer) clearTimeout(dt.timer);
      dt.side = side;
      dt.timer = setTimeout(() => { dt.timer = null; dt.side = ""; }, 300);
      handleInteraction();
    }
  }, [handleInteraction]);

  const goBack = async () => {
    setForcedLandscape(false);
    if (isFullscreen) await exitFullscreen();
    onBack();
  };

  const togglePlay = () => {
    if (preloadPhase) return;

    if (isVimeo && vimeoPlayerRef.current) {
      if (isPlaying) {
        vimeoPlayerRef.current.pause().catch(() => undefined);
        setIsPlaying(false);
      } else {
        vimeoPlayerRef.current.play().then(() => setIsPlaying(true)).catch(() => undefined);
      }
      return;
    }

    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skip = (s: number) => {
    if (isVimeo && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.getCurrentTime()
        .then((time) => vimeoPlayerRef.current?.setCurrentTime(Math.max(0, time + s)).catch(() => undefined))
        .catch(() => undefined);
      return;
    }

    if (videoRef.current) videoRef.current.currentTime += s;
  };

  const toggleMute = () => {
    if (isVimeo && vimeoPlayerRef.current) {
      const nextMuted = !isMuted;
      vimeoPlayerRef.current.setMuted(nextMuted).catch(() => undefined);
      setIsMuted(nextMuted);
      return;
    }

    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration || 0);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    if (v.buffered.length > 0) setBufferedEnd(v.duration ? (getBufferedSegmentEnd(v) / v.duration) * 100 : 0);
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.buffered.length > 0) setBufferedEnd(video.duration ? (getBufferedSegmentEnd(video) / video.duration) * 100 : 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));

    if (isVimeo && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.getDuration()
        .then((totalDuration) => vimeoPlayerRef.current?.setCurrentTime(percent * totalDuration).catch(() => undefined))
        .catch(() => undefined);
      return;
    }

    if (!videoRef.current) return;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const fmtRemaining = (cur: number, dur: number) => {
    const rem = Math.max(0, dur - cur);
    return `-${Math.floor(rem / 60)}:${Math.floor(rem % 60).toString().padStart(2, "0")}`;
  };

  const forcedStyle = forcedLandscape && !isLandscape ? {
    transform: "rotate(90deg)",
    transformOrigin: "center center",
    width: "100vh",
    height: "100vw",
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    marginTop: "-50vw",
    marginLeft: "-50vh",
    zIndex: 9999,
  } : undefined;

  const videoDisplayStyle = {
    background: "#000",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
  };

  const handleVideoError = () => {
    setVideoError("Unable to play this video. The link may be invalid or expired.");
    setIsLoading(false);
  };

  // Shared top bar overlay
  const TopBar = ({ className = "" }: { className?: string }) => (
    <div
      className={`absolute inset-x-0 top-0 flex items-center px-4 py-3 z-30 ${className}`}
      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}
    >
      <button onClick={goBack} className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-opacity">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>
    </div>
  );

  // Shared bottom action bar (fullscreen + orientation)
  const BottomActionBar = ({ className = "" }: { className?: string }) => (
    <div
      className={`absolute inset-x-0 bottom-0 flex items-center justify-end gap-3 px-4 py-4 z-30 ${className}`}
      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}
    >
      <button onClick={toggleOrientation} className="text-white p-2 rounded-lg transition-all hover:scale-110 active:scale-95" style={{ background: "rgba(255,255,255,0.12)" }}>
        {isLandscape || forcedLandscape ? <Smartphone className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
      </button>
      <button onClick={toggleFullscreen} className="text-white p-2 rounded-lg transition-all hover:scale-110 active:scale-95" style={{ background: "rgba(255,255,255,0.12)" }}>
        {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff" }}>
      {/* Portrait top bar */}
      {!isFullscreen && !forcedLandscape && (
        <div className="flex items-center px-4 py-3" style={{ background: "linear-gradient(to bottom, rgba(20,20,20,0.95), transparent)" }}>
          <button onClick={goBack} className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-opacity">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      )}

      <div>
        <div
          ref={containerRef}
          className={`relative overflow-hidden ${isFullscreen ? "w-screen h-screen" : forcedLandscape ? "" : "w-full h-[56vw] min-h-[220px] max-h-[70vh]"}`}
          style={{ background: "#000", ...forcedStyle }}
          onClick={handleInteraction}
          onMouseMove={handleInteraction}
          onTouchStart={handleDoubleTap}
        >
          <div className="absolute inset-0 transition-all duration-700 ease-in-out" style={squeezeActive ? { left: `${squeezeWidth}%`, bottom: `${squeezeHeight}%` } : undefined}>
            {videoError && !useIframe ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <WifiOff className="w-10 h-10 text-white/40" />
                <p className="text-sm text-white/60 text-center px-8">{videoError}</p>
              </div>
            ) : useIframe ? (
              <>
                {/* Iframe player for Vimeo and other cloud share pages.
                    For Vimeo we rely on its NATIVE controls (Play, Seek, Fullscreen)
                    because they reliably handle mobile landscape/fullscreen.
                    Branding (V logo, Watch Later, Share, byline) is hidden via URL params. */}
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                  allowFullScreen
                  sandbox={isVimeo ? "allow-scripts allow-same-origin allow-presentation" : "allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-presentation"}
                  onLoad={() => {
                    if (!isVimeo) setIsLoading(false);
                  }}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black/80 pointer-events-none">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: PLAYER_ACCENT }} />
                    <p className="text-sm text-white/70">Loading video...</p>
                  </div>
                )}
                {/* Minimal back button — top-left only. Rest of iframe gets clicks
                    so Vimeo's native play/fullscreen controls work normally. */}
                {!isFullscreen && (
                  <div className="absolute top-0 left-0 z-30 p-3 pointer-events-none">
                    <button
                      onClick={goBack}
                      className="pointer-events-auto flex items-center gap-2 text-sm text-white px-3 py-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="hidden sm:inline">Back</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Native video player for Dropbox, OneDrive */}
                  <video
                  ref={videoRef}
                  className="absolute inset-0"
                  style={videoDisplayStyle}
                  preload="auto"
                  onTimeUpdate={handleTimeUpdate}
                  onProgress={handleProgress}
                    onPlay={() => {
                      setIsPlaying(true);
                      setIsLoading(false);
                      setShowControls(true);
                      queueControlsHide(true);
                      if (isMobileDevice && !autoImmersiveRef.current && !immersiveMode) {
                        autoImmersiveRef.current = true;
                        void enterFullscreen();
                      }
                    }}
                    onPause={() => {
                      setIsPlaying(false);
                      setShowControls(true);
                      queueControlsHide(false);
                    }}
                  onLoadedMetadata={() => {
                    setDuration(videoRef.current?.duration || 0);
                    startPlayback();
                  }}
                  onCanPlayThrough={() => startPlayback()}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => { setIsBuffering(false); setIsLoading(false); }}
                  onError={handleVideoError}
                  playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  controlsList="nodownload noplaybackrate nofullscreen"
                >
                  <source src={videoSrc} type={detectVideoMime(videoSrc)} />
                </video>

                {/* Double-tap seek indicator */}
                {seekIndicator && (
                  <div className={`absolute top-0 ${seekIndicator === "left" ? "left-0" : "right-0"} w-1/3 h-full flex items-center justify-center z-30 pointer-events-none`}>
                    <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center animate-ping">
                      {seekIndicator === "left" ? <RotateCcw className="w-8 h-8 text-white" /> : <RotateCw className="w-8 h-8 text-white" />}
                    </div>
                    <span className="absolute mt-20 text-xs font-bold text-white">{seekIndicator === "left" ? "-10s" : "+10s"}</span>
                  </div>
                )}

                {/* Loading spinner — only while initial load */}


                {/* Loading/buffering overlay */}
                {!preloadPhase && (isLoading || isBuffering) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black/70">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: PLAYER_ACCENT }} />
                    <p className="text-sm text-white/70">Buffering...</p>
                  </div>
                )}

                {/* Controls overlay — Netflix style */}
                <div
                  className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 ${showControls && !isLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  style={{ background: showControls ? "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.85) 100%)" : "transparent" }}
                >
                  {/* Top bar */}
                  <div className="flex items-center px-4 py-3 safe-area-inset">
                    <button onClick={goBack} className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-opacity">
                      <ArrowLeft className="w-5 h-5" />
                      <span className="hidden sm:inline">Back</span>
                    </button>
                  </div>

                  {/* Center controls — compact & translucent */}
                  <div className="absolute inset-0 flex items-center justify-center gap-10 sm:gap-8 pointer-events-none">
                    {isBuffering ? (
                      <Loader2 className="w-10 h-10 animate-spin pointer-events-auto" style={{ color: PLAYER_ACCENT }} />
                    ) : (
                      <>
                        <button onClick={() => skip(-10)} className="pointer-events-auto relative player-btn-theme-dim transition-all hover:scale-110 p-2 -m-2">
                          <RotateCcw className="w-7 h-7 sm:w-6 sm:h-6" />
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/80">10</span>
                        </button>
                        <button
                          onClick={togglePlay}
                          className="pointer-events-auto rounded-full p-2.5 transition-all hover:scale-110 player-btn-theme"
                          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
                        >
                          {isPlaying ? <Pause className="w-6 h-6 sm:w-5 sm:h-5" fill="currentColor" /> : <Play className="w-6 h-6 sm:w-5 sm:h-5" fill="currentColor" />}
                        </button>
                        <button onClick={() => skip(10)} className="pointer-events-auto relative player-btn-theme-dim transition-all hover:scale-110 p-2 -m-2">
                          <RotateCw className="w-7 h-7 sm:w-6 sm:h-6" />
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/80">10</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Bottom controls */}
                  <div className="px-4 pb-6 pt-8 safe-area-inset">
                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-mono text-white/80 w-10 text-right">{fmtTime(currentTime)}</span>
                      <div
                        ref={progressBarRef}
                        className="flex-1 h-[6px] sm:h-[4px] rounded-full cursor-pointer relative group"
                        style={{ background: "rgba(255,255,255,0.2)" }}
                        onClick={handleSeek}
                      >
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${bufferedEnd}%`, background: "rgba(255,255,255,0.3)" }} />
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${progress}%`, background: PLAYER_ACCENT }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          style={{ left: `${progress}%`, background: PLAYER_ACCENT, transform: "translate(-50%, -50%)", boxShadow: `0 0 6px ${PLAYER_ACCENT}` }} />
                      </div>
                      <span className="text-xs font-mono text-white/80 w-12">{fmtRemaining(currentTime, duration)}</span>
                    </div>

                    {/* Buttons row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <button onClick={togglePlay} className="player-btn-theme p-1 active:scale-90">
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                        <button onClick={() => skip(-10)} className="player-btn-theme-dim p-1 active:scale-90">
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button onClick={() => skip(10)} className="player-btn-theme-dim p-1 active:scale-90">
                          <RotateCw className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={toggleMute} className="player-btn-theme-dim p-1 active:scale-90">
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="cinematic-player-volume w-16"
                            style={{ background: `linear-gradient(to right, ${PLAYER_ACCENT} 0%, ${PLAYER_ACCENT} ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.28) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.28) 100%)` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={toggleOrientation} className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95 player-btn-theme" style={{ background: "rgba(255,255,255,0.12)" }}>
                          {isLandscape || forcedLandscape ? <Smartphone className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleFullscreen} className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95 player-btn-theme" style={{ background: "rgba(255,255,255,0.12)" }}>
                          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <SqueezeBackOverlay currentTime={currentTime} isPlaying={isPlaying} onSqueezeActive={(active, width, height) => { setSqueezeActive(active); if (width) setSqueezeWidth(width); if (height) setSqueezeHeight(height); }} />
          <LowerThirdOverlay currentTime={currentTime} isPlaying={isPlaying} />
        </div>
      </div>

      {/* Movie info + recommendations - portrait only */}
      {!isFullscreen && !forcedLandscape && (
        <div className="px-4 md:px-12 py-6">
          <h1 className="text-lg font-semibold mb-1 text-white">{movie.title}</h1>
          <p className="text-sm text-white/50 mb-4 leading-relaxed">{movie.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {movie.category && (
              <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/60 bg-white/5">
                {movie.category}
              </span>
            )}
            {movie.vj && (
              <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/60 bg-white/5">
                🎙 {movie.vj}
              </span>
            )}
          </div>

          {/* More Like This */}
          {recommendations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-semibold mb-3 text-white">More like this</h2>
              <div className="flex gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onPlayRecommended?.(rec)}
                    className="flex-shrink-0 w-[100px] sm:w-[120px] cursor-pointer group"
                  >
                    <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-white/5">
                      {rec.thumbnail_url ? (
                        <img src={rec.thumbnail_url} alt={rec.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-white/30" />
                        </div>
                      )}
                      <div className="absolute top-0 left-0 px-1 py-0.5 text-[9px] font-bold rounded-br-md"
                        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", color: "hsl(var(--primary-foreground))" }}>
                        {rec.is_free ? "FREE" : "Subscription"}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    </div>
                    <p
                      className="mt-1 text-[11px] font-semibold truncate"
                      style={{ color: "hsl(var(--primary-foreground))", textShadow: "0 1px 6px hsla(var(--primary), 0.55)" }}
                    >
                      {rec.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
