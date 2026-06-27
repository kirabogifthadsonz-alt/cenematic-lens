import { useWatchedMovies } from "@/hooks/useWatchedMovies";
import { useNavigate } from "react-router-dom";
import { Play, CheckCircle } from "lucide-react";

export default function WatchedRow() {
  const movies = useWatchedMovies();
  const navigate = useNavigate();

  if (movies.length === 0) return null;

  return (
    <div className="px-4 md:px-12 py-3">
      <h2 className="text-lg md:text-xl font-display font-semibold mb-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-primary" />
        Watched
        <span className="text-xs text-muted-foreground font-normal ml-2">Free to re-watch for 30 days</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
        {movies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="relative flex-shrink-0 w-[140px] md:w-[200px] group cursor-pointer"
          >
            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-secondary">
              {movie.thumbnail_url ? (
                <img src={movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded-br-md" style={{ background: "linear-gradient(135deg, #27ae60, #2ecc71)", color: "#fff" }}>
                RE-WATCH FREE
              </div>
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-10 h-10 text-primary fill-primary" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">{movie.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
