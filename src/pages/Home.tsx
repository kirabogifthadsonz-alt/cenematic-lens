import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import ContentRow from "@/components/ContentRow";
import { titles, getByCategory, getVJ, getFree } from "@/lib/content-data";

const heroTitles = titles.slice(0, 5);

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const hero = heroTitles[heroIdx];

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroTitles.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="relative h-[70vh] md:h-[85vh]">
        <div className="absolute inset-0 bg-secondary">
          <video
            key={hero.id}
            autoPlay
            muted
            className="w-full h-full object-cover opacity-60"
            src={hero.videoUrl}
          />
        </div>
        <div className="absolute inset-0 gradient-cinema" />
        <div className="absolute bottom-[15%] md:bottom-[20%] left-4 md:left-12 z-10 max-w-lg">
          <h1 className="text-display text-4xl md:text-6xl mb-3 leading-tight">{hero.title}</h1>
          <p className="text-sm md:text-base text-foreground/80 mb-5 line-clamp-3">{hero.description}</p>
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
        {/* Hero dots */}
        <div className="absolute bottom-6 right-4 md:right-12 flex gap-1.5 z-10">
          {heroTitles.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`w-3 h-0.5 rounded-full transition-all ${i === heroIdx ? "bg-foreground w-6" : "bg-muted-foreground"}`}
            />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="-mt-20 relative z-10 pb-20">
        <ContentRow title="🔥 Trending in Uganda Now" items={getByCategory("trending")} />
        <ContentRow title="🎬 Cinematic Lens Originals" items={getByCategory("originals")} />
        <ContentRow title="🎤 VJ Bangers" items={getVJ().slice(0, 6)} />
        <ContentRow title="🇺🇬 Luganda Hits" items={getByCategory("luganda")} />
        <ContentRow title="🇳🇬 Nollywood" items={getByCategory("nollywood")} />
        <ContentRow title="👶 For Kids" items={getByCategory("kids")} />
        <ContentRow title="🆓 Watch Free" items={getFree()} />
      </div>
    </div>
  );
}
