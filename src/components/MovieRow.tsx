import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import SeriesCard from "./SeriesCard";
import { SeriesGroup } from "@/hooks/useMoviesByRow";

interface Movie {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  price_ugx: number;
  is_free: boolean;
  row?: string;
  vj?: string | null;
}

interface MovieRowProps {
  title: string;
  movies: Movie[];
  seriesGroups?: SeriesGroup[];
}

export default function MovieRow({ title, movies, seriesGroups }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const hasSeriesContent = seriesGroups && seriesGroups.length > 0;
  const hasMovieContent = movies.length > 0;

  if (!hasSeriesContent && !hasMovieContent) return null;

  return (
    <section className="mb-6">
      <h2 className="text-base sm:text-lg md:text-xl font-display px-4 md:px-12 mb-2">{title}</h2>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-6 z-10 w-8 bg-gradient-to-r from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div ref={scrollRef} className="movie-row-scroll flex gap-2 sm:gap-3 overflow-x-auto px-4 md:px-12 pb-1">
          {hasSeriesContent ? (
            seriesGroups.map((sg) => (
              <SeriesCard
                key={sg.series_id}
                seriesId={sg.series_id}
                title={sg.title}
                thumbnailUrl={sg.thumbnail_url}
                pricePerPart={sg.price_per_part}
                episodeCount={sg.episode_count}
                row={sg.row}
              />
            ))
          ) : hasMovieContent ? (
            movies.map((m) => (
              <MovieCard
                key={m.id}
                id={m.id}
                title={m.title}
                thumbnailUrl={m.thumbnail_url}
                isFree={m.is_free}
                row={m.row}
                vj={m.vj}
              />
            ))
          ) : (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[105px] sm:w-[130px] md:w-[160px] aspect-[2/3] rounded-md bg-secondary animate-pulse" />
            ))
          )}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-6 z-10 w-8 bg-gradient-to-l from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
