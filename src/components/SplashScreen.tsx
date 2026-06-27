import { useEffect, useState } from "react";
import logoLens from "@/assets/logo-lens.jpg";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"cinematic" | "done">("cinematic");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("done"), 2500);
    const t2 = setTimeout(onComplete, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <div className="animate-fade-in text-center">
        <img src={logoLens} alt="Cinematic Lens" className="w-48 h-48 md:w-64 md:h-64 mx-auto rounded-full object-cover mb-4 animate-pulse shadow-2xl shadow-primary/30" />
        <p className="text-lg text-muted-foreground">Movies, streamed your way</p>
      </div>
    </div>
  );
}
