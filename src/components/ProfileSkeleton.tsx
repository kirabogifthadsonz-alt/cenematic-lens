// Branded profile skeleton — instant placeholder, also works offline.
export default function ProfileSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-secondary ring-2 ring-primary/30 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[8px] font-display font-bold uppercase tracking-[0.18em] leading-tight text-center select-none"
                style={{ color: "hsla(var(--primary), 0.35)" }}
              >
                Cinematic<br />Lens
              </span>
            </div>
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
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-secondary/70" />
          <div className="h-3 w-24 rounded bg-secondary/50" />
          <div className="h-3 w-20 rounded bg-secondary/40" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-secondary/50" />
        <div className="h-10 rounded-md bg-secondary/60" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-secondary/50" />
        <div className="h-10 rounded-md bg-secondary/60" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-32 rounded-md bg-secondary/60" />
        <div className="h-10 w-24 rounded-md bg-secondary/40" />
      </div>
    </div>
  );
}
