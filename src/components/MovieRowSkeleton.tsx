import MovieCardSkeleton from "./MovieCardSkeleton";

interface Props {
  title?: string;
  count?: number;
}

export default function MovieRowSkeleton({ title, count = 8 }: Props) {
  return (
    <section className="mb-6">
      {title ? (
        <h2 className="text-base sm:text-lg md:text-xl font-display px-4 md:px-12 mb-2">
          {title}
        </h2>
      ) : (
        <div className="px-4 md:px-12 mb-2">
          <div className="h-5 w-32 rounded bg-card/60 border border-border/40" />
        </div>
      )}
      <div className="flex gap-2 sm:gap-3 overflow-x-hidden px-4 md:px-12 pb-1">
        {Array.from({ length: count }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
