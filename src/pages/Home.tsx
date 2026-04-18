import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import ContentRow from "@/components/ContentRow";
import SkeletonRow from "@/components/SkeletonRow";
import { useTitles } from "@/hooks/use-titles";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

export default function Home() {
  useScrollRestoration("home");
  const { titles, loading, getTrending, getByRow, getByCategory, getVJ, getFree, getComingSoon } = useTitles();
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
        <SkeletonRow title="🔥 Trending Now" />
        <SkeletonRow title="🆕 New Release" />
        <SkeletonRow title="🎬 Cinematic Lens Originals" />
        <SkeletonRow title="📺 Series" />
        <SkeletonRow title="🇺🇬 Ugawood Hits" />
        <SkeletonRow title="🎤 VJ Bangers" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
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
              <Link
                to={`/title/${hero.id}`}
                className="flex items-center gap-2 bg-foreground text-background px-5 md:px-7 py-2.5 rounded font-semibold hover:bg-foreground/80 transition"
              >
                <Play className="w-5 h-5 fill-background" /> Play
              </Link>
              <Link
                to={`/title/${hero.id}`}
                className="flex items-center gap-2 bg-secondary/80 text-foreground px-5 md:px-7 py-2.5 rounded font-semibold hover:bg-secondary transition"
              >
                <Info className="w-5 h-5" /> More Info
              </Link>
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

      {/* Rows — live from database */}
      <div className={`${hero ? "-mt-20" : "pt-20"} relative z-10 pb-20`}>
        <ContentRow title="🔥 Trending Now" items={getTrending()} />
        <ContentRow title="🆕 New Release" items={getByRow("New Release")} />
        <ContentRow title="🎬 Cinematic Lens Originals" items={getByRow("Cinematic Lens Original")} />
        <ContentRow title="📺 Series" items={getByRow("Series")} />
        <ContentRow title="🇺🇬 Ugawood Hits" items={getByRow("Ugawood Hits")} />
        <ContentRow title="🎤 VJ Bangers" items={getVJ().slice(0, 10)} />
        <ContentRow title="🇳🇬 Nollywood" items={getByRow("Nollywood")} />
        <ContentRow title="👶 Kids & Family" items={getByRow("Kids and Family")} />
        <ContentRow title="🆓 Watch Free" items={getFree()} />
        {getComingSoon().length > 0 && (
          <ContentRow title="🔜 Coming Soon" items={getComingSoon()} />
        )}
      </div>
    </div>
  );
}
