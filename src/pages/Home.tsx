import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import ContentRow from "@/components/ContentRow";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTitle, Title } from "@/lib/content-data";

const ROWS = [
  { key: "trending", label: "🔥 Trending Now", useTrending: true },
  { key: "coming-soon", label: "🎬 Coming Soon", useComingSoon: true },
  { key: "new-release", label: "🆕 New Release", row: "New Release" },
  { key: "originals", label: "🎬 Cinematic Lens Original", row: "Cinematic Lens Original" },
  { key: "ugawood", label: "🇺🇬 Ugawood Hits", row: "Ugawood Hits" },
  { key: "series", label: "📺 Series", useSeries: true },
  { key: "nollywood", label: "🇳🇬 Nollywood", row: "Nollywood" },
  { key: "kids", label: "👶 Kids and Family", row: "Kids and Family" },
  { key: "free", label: "🆓 Watch Free", useFree: true },
];

export default function Home() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    let timeout: number;

    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("titles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase fetch error:", error);
          setTitles([]);
        } else {
          setTitles((data || []).map(mapDbTitle));
        }
      } catch (err) {
        console.error("Fetch failed:", err);
        setTitles([]);
      }
      setLoaded(true);
    };

    // Hard 3-second timeout
    timeout = window.setTimeout(() => {
      if (!loaded) {
        console.error("Fetch timed out after 3 seconds");
        setTitles([]);
        setLoaded(true);
      }
    }, 3000);

    fetchData();

    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const live = titles.filter(t => t.status === "live" && !t.series_id);
  const heroTitles = live.filter(t => t.thumbnail_url).slice(0, 5);
  const hero = heroTitles[heroIdx];

  useEffect(() => {
    if (heroTitles.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroTitles.length), 6000);
    return () => clearInterval(t);
  }, [heroTitles.length]);

  const getRowItems = (row: typeof ROWS[number]) => {
    const liveTitles = titles.filter(t => t.status === "live" && !t.series_id);
    if (row.useTrending) return [...liveTitles].sort((a, b) => b.views - a.views).slice(0, 10);
    if (row.useComingSoon) return titles.filter(t => t.is_coming_soon && t.status === "live" && !t.series_id);
    if (row.useSeries) return titles.filter(t => t.is_series && !t.series_id && t.status === "live");
    if (row.useFree) return liveTitles.filter(t => t.is_free);
    if (row.row) return liveTitles.filter(t => t.row.toLowerCase() === row.row!.toLowerCase());
    return [];
  };

  // No spinner — show content or empty state immediately once loaded
  if (loaded && titles.length === 0) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-foreground text-lg font-semibold mb-2">No movies yet.</p>
          <p className="text-muted-foreground">Go to Admin panel and upload your first movie.</p>
          <Link to="/admin" className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-2 rounded font-semibold hover:bg-primary/90 transition">
            Open Admin
          </Link>
        </div>
      </div>
    );
  }

  // Brief blank screen while fetching (max 3s), no spinner
  if (!loaded) return <div className="bg-background min-h-screen" />;

  return (
    <div className="bg-background min-h-screen">
      {hero ? (
        <div className="relative h-[70vh] md:h-[85vh]">
          <div className="absolute inset-0 bg-secondary">
            {hero.thumbnail_url && <img src={hero.thumbnail_url} alt={hero.title} className="w-full h-full object-cover opacity-60" />}
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
      ) : null}

      <div className={hero ? "-mt-20 relative z-10 pb-20" : "pb-20 pt-20"}>
        {ROWS.map(row => (
          <ContentRow key={row.key} title={row.label} items={getRowItems(row)} />
        ))}
      </div>
    </div>
  );
}
