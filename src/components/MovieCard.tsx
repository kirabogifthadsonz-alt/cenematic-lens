import { useState } from "react";
import { Play, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { preloadMovieLinks } from "@/lib/dropboxPreloader";
import { useSubscription } from "@/hooks/useSubscription";
import SubscribeDialog from "@/components/SubscribeDialog";

interface MovieCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  isFree: boolean;
  row?: string;
  vj?: string | null;
}

export default function MovieCard({ id, title, thumbnailUrl, isFree, vj }: MovieCardProps) {
  const navigate = useNavigate();
  const { isActive } = useSubscription();
  const [isHovered, setIsHovered] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);

  const handlePreload = () => {
    supabase.from("movies").select("video_url, video_url_720p, video_url_480p").eq("id", id).maybeSingle()
      .then(({ data }) => { if (data) preloadMovieLinks(data); });
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    handlePreload();
    // Free movies are always playable
    if (isFree) { navigate(`/watch/${id}`); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    // Paid movies are playable if user has active subscription
    if (isActive) { navigate(`/watch/${id}`); return; }
    // No subscription - show subscribe dialog
    setShowSubscribe(true);
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative flex-shrink-0 w-[105px] sm:w-[130px] md:w-[160px] group cursor-pointer transition-transform duration-300 ${isHovered ? "scale-105 z-10" : ""}`}
      >
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-card shadow-lg">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Play className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          {/* Status badge - top right */}
          {/* Show FREE for free movies, PLAY for subscribed users, LOCK for non-subscribed */}
          <div className="absolute top-0 right-0 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-bl-md"
            style={{ background: isFree ? "hsl(142 76% 36%)" : isActive ? "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))" : "rgba(0,0,0,0.7)", color: "#fff" }}>
            {isFree ? "FREE" : (isActive ? "▶" : <Lock className="inline w-2.5 h-2.5" />)}
          </div>

          {vj && (
            <div className="absolute top-0 left-0 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-br-md bg-primary text-primary-foreground leading-tight">
              {vj}
            </div>
          )}

          <div className={`absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <div className="rounded-full p-2 bg-white/20 backdrop-blur-sm">
              {isFree || isActive ? (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
              ) : (
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <span className="text-[9px] text-white/80 font-medium">
              {isFree ? "Watch Free" : isActive ? "Watch Now" : "Subscribe"}
            </span>
          </div>
        </div>

        <div
          className="mt-1.5 px-2 py-1 rounded-md backdrop-blur-md border border-white/10"
          style={{
            background: "linear-gradient(135deg, hsla(var(--primary), 0.22), hsla(0, 0%, 0%, 0.55))",
            boxShadow: "0 4px 14px hsla(var(--primary), 0.18), inset 0 1px 0 hsla(0, 0%, 100%, 0.08)",
          }}
        >
          <p
            className="text-[11px] sm:text-xs font-semibold truncate leading-tight tracking-tight text-foreground"
            style={{ textShadow: "0 1px 3px hsla(0, 0%, 0%, 0.85), 0 0 6px hsla(0, 0%, 0%, 0.6)" }}
          >
            {title}
          </p>
        </div>
      </div>

      <SubscribeDialog
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        onActivated={() => navigate(`/watch/${id}`)}
        title="Subscribe to watch"
        subtitle={`Unlock "${title}" and every other movie.`}
      />
    </>
  );
}
