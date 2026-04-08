import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

interface TeraboxPlayerProps {
  url: string;
  title: string;
  wallet: number;
}

export default function TeraboxPlayer({ url, title: movieTitle, wallet }: TeraboxPlayerProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<number>(0);

  // If iframe doesn't load within 8s, assume it's blocked
  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      if (loading) setBlocked(true);
    }, 8000);
    return () => clearTimeout(timeoutRef.current);
  }, [loading]);

  const handleLoad = () => {
    setLoading(false);
    clearTimeout(timeoutRef.current);
  };

  const handleError = () => {
    setBlocked(true);
    setLoading(false);
  };

  const openExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Blocked / fallback UI
  if (blocked) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-foreground hover:text-primary transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-sm md:text-base font-medium text-foreground truncate max-w-[200px] md:max-w-none">
              {movieTitle}
            </span>
          </div>
          <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
            UGX {wallet.toLocaleString()}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-foreground text-xl font-semibold mb-3">Opening Video Player</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This video will open in a secure player tab for the best streaming experience.
            </p>
            <button
              onClick={openExternal}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-base hover:bg-primary/90 transition w-full flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Watch Now
            </button>
            <button
              onClick={() => navigate(-1)}
              className="mt-3 text-muted-foreground hover:text-foreground text-sm transition w-full py-2"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading video…</p>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-30 px-4 md:px-8 py-4 flex items-center justify-between bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-foreground hover:text-primary transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-sm md:text-base font-medium text-foreground truncate max-w-[200px] md:max-w-none">
            {movieTitle}
          </span>
        </div>
        <div className="bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary">
          UGX {wallet.toLocaleString()}
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={url}
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        onLoad={handleLoad}
        onError={handleError}
        style={{ backgroundColor: "hsl(var(--background))" }}
      />

      <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-primary/60" />
    </div>
  );
}
