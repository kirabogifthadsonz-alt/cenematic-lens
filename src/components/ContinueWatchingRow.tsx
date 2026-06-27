import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useContinueWatching } from "@/hooks/useContinueWatching";

export default function ContinueWatchingRow() {
  const movies = useContinueWatching();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  if (movies.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl md:text-2xl font-display px-4 md:px-12 mb-3">Continue Watching</h2>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-6 z-10 w-10 bg-gradient-to-r from-background/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div ref={scrollRef} className="movie-row-scroll flex gap-3 overflow-x-auto px-4 md:px-12">
          {movies.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/watch/${m.id}`)}
              className="relative flex-shrink-0 w-[140px] md:w-[200px] group cursor-pointer"
            >
              <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-secondary">
                {m.thumbnail_url ? (
                  <img src={m.thumbnail_url} alt={m.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-0 left-0 price-badge">
                  {m.is_free ? "FREE" : "Subscription"}
                </div>
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-primary fill-primary" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <Progress value={m.progress} className="h-1 bg-muted/50" />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground truncate">{m.title}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-6 z-10 w-10 bg-gradient-to-l from-background/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
