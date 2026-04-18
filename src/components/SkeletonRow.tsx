export default function SkeletonRow({ title, count = 6 }: { title: string; count?: number }) {
  return (
    <div className="mb-8 md:mb-10">
      <h2 className="text-display text-xl md:text-2xl tracking-wider px-4 md:px-12 mb-3">{title}</h2>
      <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[140px] md:w-[220px] rounded-md overflow-hidden bg-card"
          >
            <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-secondary via-card to-secondary animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <span className="text-display text-[11px] md:text-sm tracking-[0.2em] text-muted-foreground/60 text-center leading-tight">
                  CINEMATIC<br />LENS
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
            <div className="p-2">
              <div className="h-2 w-3/4 bg-secondary rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
