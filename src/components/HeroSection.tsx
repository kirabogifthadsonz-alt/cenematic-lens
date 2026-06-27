import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isCloudStorageUrl, getCloudVideoInfo } from "@/lib/cloudVideoDetect";
import { transformVideoUrl } from "@/lib/videoUrlTransform";
import { useSubscription } from "@/hooks/useSubscription";
import SubscribeDialog from "@/components/SubscribeDialog";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface HeroMovie {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  price_ugx: number;
  is_free: boolean;
  row: string;
  vj: string | null;
  category: string | null;
}

// Subscription-based: no per-row pricing

const PREVIEW_DURATION = 10_000; // 10 seconds per movie

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    return parsed.searchParams.get("v") || parsed.pathname.match(/\/(embed|shorts)\/([^/?]+)/)?.[2] || null;
  } catch {
    return null;
  }
};

export default function HeroSection() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<HeroMovie[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [playLoading, setPlayLoading] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [youtubePreviewStatus, setYoutubePreviewStatus] = useState<"none" | "checking" | "ready" | "blocked">("none");
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const { isActive } = useSubscription();

  // Fetch hero-eligible movies — prefer movies with a trailer for autoplay preview
  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase
        .from("movies")
        .select("id, title, description, thumbnail_url, video_url, trailer_url, price_ugx, is_free, row, vj, category")
        .eq("is_coming_soon", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data?.length) {
        // Prioritize movies that have a trailer URL so preview always plays
        const withTrailer = data.filter((m) => m.trailer_url && m.trailer_url.trim().length > 0);
        const without = data.filter((m) => !m.trailer_url || m.trailer_url.trim().length === 0);
        setMovies([...withTrailer, ...without].slice(0, 5));
      }
    };
    fetchMovies();

    // Realtime subscription for new uploads
    const channel = supabase
      .channel("hero-movies")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movies" },
        () => fetchMovies()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Advance to next movie with fade transition
  const advanceMovie = useCallback(() => {
    if (movies.length <= 1) return;
    setFading(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
      setFading(false);
    }, 600); // fade-out duration
  }, [movies.length]);

  // Auto-rotate timer
  useEffect(() => {
    if (movies.length <= 1) return;
    timerRef.current = setTimeout(advanceMovie, PREVIEW_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIndex, movies.length, advanceMovie]);

  // Auto-play video when active movie changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [activeIndex]);

  const currentMovie = movies[activeIndex];

  useEffect(() => {
    let cancelled = false;
    const trailer = currentMovie?.trailer_url?.trim();

    if (!trailer) {
      setYoutubePreviewStatus("none");
      return () => {
        cancelled = true;
      };
    }

    const info = getCloudVideoInfo(trailer);
    if (info.provider !== "youtube") {
      setYoutubePreviewStatus("ready");
      return () => {
        cancelled = true;
      };
    }

    setYoutubePreviewStatus("checking");
    const controller = new AbortController();

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trailer)}&format=json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!cancelled) {
          setYoutubePreviewStatus(response.ok ? "ready" : "blocked");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setYoutubePreviewStatus("blocked");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentMovie?.id, currentMovie?.trailer_url]);

  const handlePlay = async () => {
    if (!currentMovie) return;
    if (currentMovie.is_free) { navigate(`/watch/${currentMovie.id}`); return; }
    setPlayLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPlayLoading(false); navigate("/auth"); return; }
    setPlayLoading(false);
    if (!isActive) { setShowSubscribe(true); return; }
    navigate(`/watch/${currentMovie.id}`);
  };

  // Fallback: show branded hero if no movies exist
  if (!movies.length) {
    return (
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute bottom-20 md:bottom-32 left-4 md:left-12 max-w-lg z-10">
          <h1 className="text-4xl md:text-6xl font-display leading-tight mb-2">
            Cinematic <span className="text-primary">Lens</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-1">
            Movies, streamed your way
          </p>
          <p className="text-xs text-muted-foreground">(HADZ GROUP OF COMPANIES)</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden bg-background">
      {/* Thumbnail fallback behind video */}
      {currentMovie.thumbnail_url && (
        <img
          src={currentMovie.thumbnail_url}
          alt={currentMovie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Preview — prefer YouTube trailer, but fall back to a clean thumbnail when embedding is blocked */}
      {(() => {
        const trailer = currentMovie.trailer_url?.trim();
        if (trailer) {
          const info = getCloudVideoInfo(trailer);
          if (info.provider === "youtube") {
            const youtubeId = getYouTubeVideoId(trailer);
            const youtubeThumbnail = youtubeId
              ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
              : currentMovie.thumbnail_url;

            if (youtubePreviewStatus === "ready") {
              return (
                <iframe
                  key={`trailer-${currentMovie.id}`}
                  src={info.embedUrl}
                  title={`${currentMovie.title} trailer`}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${
                    fading ? "opacity-0" : "opacity-100"
                  }`}
                  style={{
                    transition: "opacity 600ms ease-in-out",
                    transform: "scale(1.35)",
                    transformOrigin: "center",
                  }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  frameBorder={0}
                />
              );
            }

            if (youtubeThumbnail) {
              return (
                <img
                  key={`trailer-fallback-${currentMovie.id}`}
                  src={youtubeThumbnail}
                  alt={`${currentMovie.title} trailer thumbnail`}
                  className={`absolute inset-0 w-full h-full object-cover ${
                    fading ? "opacity-0" : "opacity-100"
                  }`}
                  style={{
                    transition: "opacity 600ms ease-in-out",
                    transform: "scale(1.08)",
                    transformOrigin: "center",
                  }}
                  loading="eager"
                />
              );
            }
          }
        }

        if (!currentMovie.video_url) return null;
        const url = currentMovie.video_url!;
        const isCloud = isCloudStorageUrl(url);
        const cloudInfo = isCloud ? getCloudVideoInfo(url) : null;

        if (cloudInfo && (cloudInfo.provider === "google_drive" || cloudInfo.provider === "terabox" || cloudInfo.provider === "vimeo" || cloudInfo.provider === "mediafire" || cloudInfo.provider === "mega" || cloudInfo.provider === "telegram" || cloudInfo.provider === "youtube")) {
          return null;
        }

        const videoSrc = transformVideoUrl(cloudInfo ? cloudInfo.downloadUrl : url);

        return (
          <video
            ref={videoRef}
            key={currentMovie.id}
            autoPlay
            muted
            playsInline
            crossOrigin={isCloud ? "anonymous" : undefined}
            className={`absolute inset-0 w-full h-full object-cover ${
              fading ? "opacity-0" : "opacity-100"
            }`}
            style={{ transition: "opacity 600ms ease-in-out" }}
            poster={currentMovie.thumbnail_url || undefined}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        );
      })()}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Movie info + buttons */}
      <div
        className={`absolute bottom-20 md:bottom-32 left-4 md:left-12 max-w-lg z-10 transition-opacity duration-500 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="text-3xl md:text-5xl font-display leading-tight mb-2 drop-shadow-lg">
          {currentMovie.title}
        </h1>
        {currentMovie.description && (
          <p className="text-muted-foreground text-sm md:text-base mb-4 line-clamp-2 drop-shadow">
            {currentMovie.description}
          </p>
        )}
        <div className="flex gap-3">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 gap-2 font-semibold"
            onClick={handlePlay}
            disabled={playLoading}
          >
            <Play className="w-5 h-5 fill-current" /> {playLoading ? "Loading..." : "Play"}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 font-semibold bg-secondary/80 hover:bg-secondary"
            onClick={() => setShowInfoDialog(true)}
          >
            <Info className="w-5 h-5" /> More Info
          </Button>
        </div>
      </div>

      {/* Dot indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {movies.map((m, i) => (
            <button
              key={m.id}
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setFading(true);
                setTimeout(() => {
                  setActiveIndex(i);
                  setFading(false);
                }, 400);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/50 hover:bg-muted-foreground"
              }`}
              aria-label={`Show ${m.title}`}
            />
          ))}
        </div>
      )}

      {/* Subscribe dialog */}
      <SubscribeDialog
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        onActivated={() => currentMovie && navigate(`/watch/${currentMovie.id}`)}
        title="Subscribe to watch"
        subtitle={currentMovie ? `Unlock "${currentMovie.title}" and every other movie.` : ""}
      />

      {/* More Info Dialog */}
      <AlertDialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{currentMovie.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {currentMovie.thumbnail_url && (
                  <img src={currentMovie.thumbnail_url} alt={currentMovie.title} className="w-full aspect-video object-cover rounded-lg" />
                )}
                {currentMovie.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentMovie.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  {currentMovie.category && (
                    <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                      📁 {currentMovie.category}
                    </span>
                  )}
                  {currentMovie.vj && (
                    <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                      🎙 {currentMovie.vj}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    📂 {currentMovie.row}
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-medium bg-primary/20 text-primary">
                    {currentMovie.is_free ? "FREE" : "Subscription"}
                  </span>

                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowInfoDialog(false); handlePlay(); }}>
              ▶ Watch Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
