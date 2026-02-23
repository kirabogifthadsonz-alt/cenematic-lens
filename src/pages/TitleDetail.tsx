import { useParams, useNavigate, Link } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { useStore } from "@/lib/store";
import { Play, Plus, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

export default function TitleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, loading } = useTitles();
  const { myList, addToList, removeFromList, freeCredits, wallet } = useStore();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const store = useStore();

  const title = getById(id || "");

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!title) return <div className="min-h-screen bg-background pt-20 px-4 text-foreground">Title not found.</div>;

  const inList = myList.includes(title.id);
  const canWatchFree = title.is_free || freeCredits > 0;

  const handleWatch = () => {
    if (title.is_free) {
      navigate(`/player/${title.id}`);
      return;
    }
    const result = store.watchTitle(title.id, title.title);
    if (result === "insufficient") {
      setShowDepositModal(true);
    } else {
      navigate(`/player/${title.id}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="relative h-[50vh] md:h-[65vh]">
        {title.video_url ? (
          <video autoPlay muted loop className="w-full h-full object-cover opacity-50" src={title.video_url} />
        ) : title.thumbnail_url ? (
          <img src={title.thumbnail_url} className="w-full h-full object-cover opacity-50" alt={title.title} />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 gradient-cinema" />
        <button onClick={() => navigate(-1)} className="absolute top-20 left-4 md:left-12 z-10 text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="absolute bottom-[10%] left-4 md:left-12 z-10 max-w-2xl">
          <h1 className="text-display text-4xl md:text-6xl mb-3">{title.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="text-cinema-gold font-semibold">{title.rating}</span>
            <span>{title.year}</span>
            <span>{title.duration}</span>
            <span>{title.genre}</span>
            <span>{title.language}</span>
          </div>
          <p className="text-foreground/80 mb-6 text-sm md:text-base">{title.description}</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleWatch} className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded font-semibold hover:bg-foreground/80 transition">
              <Play className="w-5 h-5 fill-background" />
              {title.is_free ? "Watch Free" : canWatchFree ? "Watch Free (1 credit)" : `Watch Now – ${title.price} UGX`}
            </button>
            <button onClick={() => inList ? removeFromList(title.id) : addToList(title.id)} className="flex items-center gap-2 bg-secondary/80 text-foreground px-6 py-3 rounded font-semibold hover:bg-secondary transition">
              {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {inList ? "In My List" : "My List"}
            </button>
          </div>
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-display text-2xl mb-4">Insufficient Balance</h2>
            <p className="text-muted-foreground mb-6">You need at least {title.price} UGX. Deposit minimum 3,000 UGX.</p>
            <Link to="/wallet" className="bg-primary text-primary-foreground px-6 py-3 rounded font-semibold inline-block hover:bg-primary/90 transition">Deposit Now</Link>
            <button onClick={() => setShowDepositModal(false)} className="block w-full mt-4 text-muted-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
