import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MovieRow from "@/components/MovieRow";
import MovieRowSkeleton from "@/components/MovieRowSkeleton";
import Footer from "@/components/Footer";
import MarqueeBar from "@/components/MarqueeBar";
import { useTitles } from "@/hooks/use-titles";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { Play, Info } from "lucide-react";

export default function Home() {
  useScrollRestoration("home");
  const navigate = useNavigate();
  const { titles, loading, getTrending, getByRow, getVJ, getFree, getComingSoon } = useTitles();
  const [heroIdx, setHeroIdx] = useState(0);

  const liveItems = titles.filter(t => t.status === "live" && !t.is_coming_soon);
  const heroTitles = liveItems.slice(0, 5);
  const hero = heroTitles[heroIdx] || null;

  useEffect(() => {
    if (heroTitles.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroTitles.length), 6000);
    return () => clearInterval(t);
  }, [heroTitles.length]);

  if (loading || titles.length === 0) {
    return (
      <div className="bg-background min-h-screen pt-24 pb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <MovieRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* NEW SHELL: Hero Section with new design */}
      {hero && (
        <div className="relative h-[70vh] md:h-[85vh]">
          <div className="absolute inset-0 bg-secondary">
            {hero.video_url && (
              <video key={hero.id} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60" src={hero.video_url} />
            )}
          </div>
          <div className="absolute inset-0 gradient-cinema" />
          <div className="absolute bottom-[15%] md:bottom-[20%] left-4 md:left-12 z-10 max-w-lg">
            <h1 className="text-display text-4xl md:text-6xl mb-3 leading-tight">{hero.title}</h1>
            <p className="text-sm md:text-base text-foreground/80 mb-5 line-clamp-3">{hero.description}</p>
            {hero.price > 0 && (
              <span className="inline-block mb-3 bg-gradient-to-r from-primary to-yellow-500 text-background text-xs font-bold px-3 py-1 rounded">
                UGX {hero.price.toLocaleString()}
              </span>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/title/${hero.id}`)}
                className="flex items-center gap-2 bg-foreground text-background px-5 md:px-7 py-2.5 rounded font-semibold hover:bg-foreground/80 transition"
              >
                <Play className="w-5 h-5 fill-background" /> Play
              </button>
              <button
                onClick={() => navigate(`/title/${hero.id}`)}
                className="flex items-center gap-2 bg-secondary/80 text-foreground px-5 md:px-7 py-2.5 rounded font-semibold hover:bg-secondary transition"
              >
                <Info className="w-5 h-5" /> More Info
              </button>
            </div>
          </div>
          <div className="absolute bottom-6 right-4 md:right-12 flex gap-1.5 z-10">
            {heroTitles.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                className={`w-3 h-0.5 rounded-full transition-all ${i === heroIdx ? "bg-foreground w-6" : "bg-muted-foreground"}`}
              />
            ))}
          </div>
        </div>
      )}

      <MarqueeBar />

      {/* NEW SHELL: Movie Rows with original data wiring */}
      <div className={`${hero ? "-mt-20" : "pt-20"} relative z-10 pb-20`}>
        {/* Trending */}
        {getTrending().length > 0 && (
          <MovieRow title="🔥 Trending Now" movies={getTrending().map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* New Release */}
        {getByRow("New Release").length > 0 && (
          <MovieRow title="🆕 New Release" movies={getByRow("New Release").map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Cinematic Lens Originals */}
        {getByRow("Cinematic Lens Original").length > 0 && (
          <MovieRow title="🎬 Cinematic Lens Originals" movies={getByRow("Cinematic Lens Original").map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Series */}
        {getByRow("Series").length > 0 && (
          <MovieRow title="📺 Series" movies={getByRow("Series").map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Ugawood Hits */}
        {getByRow("Ugawood Hits").length > 0 && (
          <MovieRow title="🇺🇬 Ugawood Hits" movies={getByRow("Ugawood Hits").map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* VJ Bangers */}
        {getVJ().length > 0 && (
          <MovieRow title="🎤 VJ Bangers" movies={getVJ().slice(0, 10).map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Nollywood */}
        {getByRow("Nollywood").length > 0 && (
          <MovieRow title="🇳🇬 Nollywood" movies={getByRow("Nollywood").map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Kids & Family */}
        {getByRow("Kids and Family").length > 0 && (
          <MovieRow title="👶 Kids & Family" movies={getByRow("Kids and Family").map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Watch Free */}
        {getFree().length > 0 && (
          <MovieRow title="🆓 Watch Free" movies={getFree().map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}

        {/* Coming Soon */}
        {getComingSoon().length > 0 && (
          <MovieRow title="🔜 Coming Soon" movies={getComingSoon().map(t => ({
            id: t.id,
            title: t.title,
            thumbnail_url: t.thumbnail_url,
            price_ugx: t.price,
            is_free: t.is_free,
            row: t.row || "Other",
            vj: t.vj_narrator
          }))} />
        )}
      </div>

      <Footer />
    </div>
  );
}
