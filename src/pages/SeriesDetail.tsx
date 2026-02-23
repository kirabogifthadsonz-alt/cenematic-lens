import { useParams, useNavigate, Link } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { useStore } from "@/lib/store";
import { Play, Plus, Check, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, getSeriesParts } = useTitles();
  const { myList, addToList, removeFromList } = useStore();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const store = useStore();

  const series = getById(id || "");
  const parts = getSeriesParts(id || "");

  if (!series) return <div className="min-h-screen bg-background pt-20 px-4 text-foreground">Series not found.</div>;

  const inList = myList.includes(series.id);

  const handleWatchPart = (partId: string, partTitle: string) => {
    if (series.is_free) {
      navigate(`/player/${partId}`);
      return;
    }
    const result = store.watchTitle(partId, partTitle);
    if (result === "insufficient") {
      setShowDepositModal(true);
    } else {
      navigate(`/player/${partId}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="relative h-[40vh] md:h-[55vh]">
        {series.thumbnail_url ? (
          <img src={series.thumbnail_url} alt={series.title} className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 gradient-cinema" />
        <button onClick={() => navigate(-1)} className="absolute top-20 left-4 md:left-12 z-10 text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="absolute bottom-[10%] left-4 md:left-12 z-10 max-w-2xl">
          <h1 className="text-display text-4xl md:text-6xl mb-3">{series.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="text-cinema-gold font-semibold">{series.rating}</span>
            <span>{series.year}</span>
            <span>{series.genre}</span>
            <span>{series.language}</span>
            {!series.is_free && (
              <span className="text-primary font-bold">UGX {series.price.toLocaleString()} / part</span>
            )}
          </div>
          <p className="text-foreground/80 mb-6 text-sm md:text-base">{series.description}</p>
          <button
            onClick={() => inList ? removeFromList(series.id) : addToList(series.id)}
            className="flex items-center gap-2 bg-secondary/80 text-foreground px-6 py-3 rounded font-semibold hover:bg-secondary transition"
          >
            {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {inList ? "In My List" : "Add to My List"}
          </button>
        </div>
      </div>

      {/* Parts grid */}
      <div className="px-4 md:px-12 py-8">
        <h2 className="text-display text-2xl mb-6">Episodes ({parts.length})</h2>
        {parts.length === 0 ? (
          <p className="text-muted-foreground">No episodes available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {parts.map(part => (
              <button
                key={part.id}
                onClick={() => handleWatchPart(part.id, `${series.title} S${part.season}E${part.episode}`)}
                className="bg-card border border-border rounded-lg overflow-hidden text-left hover:border-primary/50 transition group"
              >
                <div className="aspect-[2/3] bg-secondary relative">
                  {(part.thumbnail_url || series.thumbnail_url) ? (
                    <img src={part.thumbnail_url || series.thumbnail_url} alt={part.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-display text-xl text-muted-foreground">S{part.season}E{part.episode}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="w-10 h-10 text-foreground fill-foreground" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-foreground font-medium">Season {part.season} • Part {part.episode}</p>
                  <p className="text-xs text-muted-foreground">{part.duration}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-display text-2xl mb-4">Insufficient Balance</h2>
            <p className="text-muted-foreground mb-6">You need at least UGX {series.price.toLocaleString()} to watch. Deposit minimum 3,000 UGX.</p>
            <Link to="/wallet" className="bg-primary text-primary-foreground px-6 py-3 rounded font-semibold inline-block hover:bg-primary/90 transition">
              Deposit Now
            </Link>
            <button onClick={() => setShowDepositModal(false)} className="block w-full mt-4 text-muted-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
