// Branded skeleton card — faint "CINEMATIC LENS" wordmark with shimmer sweep.
// Used while data loads, and as the offline placeholder when there's no network.
export default function MovieCardSkeleton() {
  return (
    <div className="relative flex-shrink-0 w-[105px] sm:w-[130px] md:w-[160px]">
      <div
        className="relative aspect-[2/3] rounded-md overflow-hidden bg-card border border-border/50"
        style={{
          background:
            "linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 12%) 50%, hsl(0 0% 8%) 100%)",
        }}
      >
        {/* Centered faint wordmark */}
        <div className="absolute inset-0 flex items-center justify-center px-1 text-center">
          <span
            className="text-[8px] sm:text-[9px] font-display font-bold uppercase tracking-[0.18em] leading-tight select-none"
            style={{ color: "hsla(var(--primary), 0.32)" }}
          >
            Cinematic
            <br />
            Lens
          </span>
        </div>

        {/* Shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_2s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, hsla(0, 0%, 100%, 0.06) 50%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Title placeholder */}
      <div className="mt-1.5 h-5 rounded-md bg-card/60 border border-border/40" />
    </div>
  );
}
