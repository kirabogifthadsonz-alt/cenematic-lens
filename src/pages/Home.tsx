import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info, Loader2 } from "lucide-react";
import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";

const ROWS = [
  { key: "trending", label: "🔥 Trending Now", useTrending: true },
  { key: "originals", label: "🎬 Cinematic Lens Originals", category: "originals" },
  { key: "vjs", label: "🎤 VJ Bangers", useVJ: true },
  { key: "luganda", label: "🇺🇬 Luganda Hits", category: "luganda" },
  { key: "nollywood", label: "🇳🇬 Nollywood", category: "nollywood" },
  { key: "kids", label: "👶 For Kids", category: "kids" },
  { key: "new", label: "🆕 New Releases", category: "new" },
  { key: "action", label: "💥 Action & Thriller", category: "action" },
  { key: "free", label: "🆓 Watch Free", useFree: true },
];

export default function Home() {
  const { titles, loading, getTrending, getByCategory, getVJ, getFree, getByRow } = useTitles();
  const [heroIdx, setHeroIdx] = useState(0);

  const liveItems = titles.filter(t => t.status === "live" && !t.series_id);
  const heroTitles = liveItems.slice(0, 5);
  const hero = heroTitles[heroIdx];

  useEffect(() => {
    if (heroTitles.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroTitles.length), 6000);
    return () => clearInterval(t);
  }, [heroTitles.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRowItems = (row: typeof ROWS[number]) => {
    if (row.useTrending) return getTrending();
    if (row.useVJ) return getVJ().slice(0, 10);
    if (row.useFree) return getFree();
    if (row.category) return getByCategory(row.category);
    return getByRow(row.key);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      {hero ? (
        <div className="relative h-[70vh] md:h-[85vh]">
          <div className="absolute inset-0 bg-secondary">
            {hero.video_url ? (
              <video key={hero.id} autoPlay muted className="w-full h-full object-cover opacity-60" src={hero.video_url} />
            ) : hero.thumbnail_url ? (
              <img src={hero.thumbnail_url} alt={hero.title} className="w-full h-full object-cover opacity-60" />
            ) : null}
          </div>
          <div className="absolute inset-0 gradient-cinema" />
          <div className="absolute bottom-[15%] md:bottom-[20%] left-4 md:left-12 z-10 max-w-lg">
            <h1 className="text-display text-4xl md:text-6xl mb-3 leading-tight">{hero.title}</h1>
            <p className="text-sm md:text-base text-foreground/80 mb-5 line-clamp-3">{hero.description}</p>
            <div className="flex gap-3">
              <Link to={`/title/${hero.id}`} className="flex items-center gap-2 bg-foreground text-background px-5 md:px-7 py-2.5 rounded font-semibold hover:bg-foreground/80 transition">
                <Play className="w-5 h-5 fill-background" /> Play
              </Link>
              <Link to={`/title/${hero.id}`} className="flex items-center gap-2 bg-secondary/80 text-foreground px-5 md:px-7 py-2.5 rounded font-semibold hover:bg-secondary transition">
                <Info className="w-5 h-5" /> More Info
              </Link>
            </div>
          </div>
          <div className="absolute bottom-6 right-4 md:right-12 flex gap-1.5 z-10">
            {heroTitles.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)} className={`w-3 h-0.5 rounded-full transition-all ${i === heroIdx ? "bg-foreground w-6" : "bg-muted-foreground"}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[50vh] flex items-center justify-center">
          <p className="text-muted-foreground text-lg">No content yet. Upload movies from the admin panel.</p>
        </div>
      )}

      {/* Rows */}
      <div className={hero ? "-mt-20 relative z-10 pb-20" : "pb-20 pt-20"}>
        {ROWS.map(row => (
          <ContentRow key={row.key} title={row.label} items={getRowItems(row)} />
        ))}
      </div>
    </div>
  );
}
