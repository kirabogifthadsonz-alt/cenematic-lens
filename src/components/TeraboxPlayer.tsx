import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TeraboxPlayerProps {
  url: string;
  title: string;
  wallet: number;
}

/**
 * Dedicated TeraBox player that embeds the TeraBox native player
 * inside an iframe with our branded overlay. Source is hidden from users.
 */
export default function TeraboxPlayer({ url, title: movieTitle, wallet }: TeraboxPlayerProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading video…</p>
          </div>
        </div>
      )}

      {/* Top bar overlay — always on top to hide TeraBox branding */}
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

      {/* TeraBox iframe — their native player handles streaming */}
      <iframe
        src={url}
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        onLoad={() => setLoading(false)}
        style={{ backgroundColor: "hsl(var(--background))" }}
      />

      {/* Bottom brand bar to cover TeraBox footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-primary/60" />
    </div>
  );
}
