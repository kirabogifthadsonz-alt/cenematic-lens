import { useParams, useNavigate } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { useSubscription } from "@/hooks/useSubscription";
import SubscribeDialog from "@/components/SubscribeDialog";
import { Play, Plus, Check, ArrowLeft, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { detectSource, getPlayableUrl, getDropboxStoredPath } from "@/lib/video-utils";

export default function TitleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, loading } = useTitles();
  const title = getById(id || "");
  const { myList, addToList, removeFromList } = useStore();
  const { isActive } = useSubscription();
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resolve a playable preview URL (Dropbox needs a fresh signed link)
  useEffect(() => {
    if (!title?.video_url) { setPreviewUrl(""); return; }
    const source = detectSource(title.video_url);
    const storedPath = getDropboxStoredPath(title.video_url);
    if (storedPath) {
      supabase.functions.invoke("dropbox-stream", { body: { path: storedPath } })
        .then(({ data, error }) => {
          if (!error && data?.url) setPreviewUrl(data.url);
        });
    } else if (source === "direct" || source === "dropbox") {
      setPreviewUrl(getPlayableUrl(title.video_url));
    } else {
      setPreviewUrl(""); // YouTube/gdrive/terabox/telegram — fall back to thumbnail
    }
  }, [title?.id, title?.video_url]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!title) return <div className="min-h-screen bg-background pt-20 px-4 text-foreground">Title not found.</div>;

  const inList = myList.includes(title.id);

  const handlePlay = async () => {
    if (title.is_free) { navigate(`/player/${title.id}`); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    if (!isActive) { setShowSubscribe(true); return; }
    navigate(`/player/${title.id}`);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero/preview area — matches HeroSection look */}
      <div className="relative h-[60vh] md:h-[80vh] overflow-hidden">
        {/* Thumbnail fallback behind the video */}
        {title.thumbnail_url && (
          <img
            src={title.thumbnail_url}
            alt={title.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Playable preview when we have a direct/dropbox URL */}
        {previewUrl && (
          <video
            ref={videoRef}
            key={previewUrl}
            autoPlay
            muted
            loop
            playsInline
            poster={title.thumbnail_url || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            src={previewUrl}
          />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 z-10 glass-pill w-9 h-9 rounded-full flex items-center justify-center text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute bottom-10 md:bottom-20 left-4 md:left-12 z-10 max-w-2xl">
          <h1 className="text-display text-3xl md:text-5xl mb-2 leading-tight drop-shadow-lg">{title.title}</h1>
          {title.description && (
            <p className="text-sm md:text-base text-foreground/85 mb-4 line-clamp-3 drop-shadow">{title.description}</p>
          )}

          <div className="flex flex-wrap gap-2 text-xs mb-5">
            <span className="px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground">{title.year}</span>
            {title.duration && <span className="px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground">⏱ {title.duration}</span>}
            {title.genre && <span className="px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground">{title.genre}</span>}
            {title.vj_narrator && (
              <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-semibold">🎙 VJ {title.vj_narrator}</span>
            )}
            {title.row && <span className="px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground">📂 {title.row}</span>}
            <span className="px-2.5 py-1 rounded-full font-medium bg-primary/20 text-primary">
              {title.is_free ? "FREE" : "Subscription"}
            </span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded font-semibold hover:bg-foreground/90 transition"
            >
              <Play className="w-5 h-5 fill-background" />
              {title.is_free ? "Watch Free" : isActive ? "Play" : "Subscribe & Watch"}
            </button>
            <button
              onClick={() => inList ? removeFromList(title.id) : addToList(title.id)}
              className="flex items-center gap-2 bg-secondary/80 text-foreground px-6 py-2.5 rounded font-semibold hover:bg-secondary transition"
            >
              {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {inList ? "In My List" : "My List"}
            </button>
          </div>
        </div>
      </div>

      {/* Extended details below the hero */}
      <div className="px-4 md:px-12 py-8 max-w-3xl">
        {title.description && (
          <>
            <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
              <Info className="w-4 h-4" /> About
            </div>
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed">{title.description}</p>
          </>
        )}

        {title.cast_members && title.cast_members.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground mb-1">Cast</p>
            <p className="text-sm text-foreground/90">{title.cast_members.join(", ")}</p>
          </div>
        )}
      </div>

      <SubscribeDialog
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        onActivated={() => navigate(`/player/${title.id}`)}
        title="Subscribe to watch"
        subtitle={`Unlock "${title.title}" and every other movie.`}
      />
    </div>
  );
}
