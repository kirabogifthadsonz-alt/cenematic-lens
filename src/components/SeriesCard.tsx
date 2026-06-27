import { useState } from "react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SeriesCardProps {
  seriesId: string;
  title: string;
  thumbnailUrl?: string | null;
  pricePerPart: number;
  episodeCount: number;
  row: string;
}

export default function SeriesCard({ seriesId, title, thumbnailUrl, pricePerPart, episodeCount, row }: SeriesCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => navigate(`/series/${seriesId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex-shrink-0 w-[105px] sm:w-[130px] md:w-[160px] group cursor-pointer transition-transform duration-300 ${
        isHovered ? "scale-105 z-10" : ""
      }`}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-card shadow-lg">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Play className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Series badge */}
        <div className="absolute top-0 left-0 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-br-md"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", color: "#fff" }}>
          SERIES
        </div>

        {/* Episode count */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-1.5 py-0.5">
          <p className="text-[9px] text-white/80">{episodeCount} part{episodeCount !== 1 ? "s" : ""}</p>
        </div>

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          <div className="rounded-full p-2 bg-white/20 backdrop-blur-sm">
            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
          </div>
          <span className="text-[9px] text-white/80 font-medium">View Series</span>
        </div>
      </div>
      <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground truncate leading-tight">{title}</p>
    </div>
  );
}
