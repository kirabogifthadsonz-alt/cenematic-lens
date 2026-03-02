import { Link } from "react-router-dom";
import { Title } from "@/lib/content-data";
import { Play, Plus, ThumbsUp } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ContentRow({ title: rowTitle, items }: { title: string; items: Title[] }) {
  const { addToList } = useStore();

  if (items.length === 0) return null;

  return (
    <div className="mb-8 md:mb-10">
      <h2 className="text-display text-xl md:text-2xl tracking-wider px-4 md:px-12 mb-3">{rowTitle}</h2>
      <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4">
        {items.map(item => (
          <Link
            key={item.id}
            to={item.is_series ? `/series/${item.id}` : `/title/${item.id}`}
            className="flex-shrink-0 w-[140px] md:w-[220px] group relative rounded-md overflow-hidden bg-card transition-transform duration-300 hover:scale-105 hover:z-10"
          >
            <div className="aspect-[2/3] bg-secondary relative overflow-hidden">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-display text-lg md:text-xl text-muted-foreground text-center px-2 leading-tight">{item.title}</span>
                </div>
              )}
              {/* Price badge for series */}
              {item.is_series && !item.is_free && (
                <span className="absolute top-2 left-2 bg-gradient-to-r from-cinema-gold to-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  UGX {item.price.toLocaleString()}
                </span>
              )}
              {item.is_free && (
                <span className="absolute top-2 left-2 bg-cinema-gold text-cinema-gold-foreground text-[10px] font-bold px-2 py-0.5 rounded">FREE</span>
              )}
              {item.is_vj && (
                <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">VJ</span>
              )}
              {item.is_coming_soon && (
                <span className="absolute bottom-2 left-2 bg-cinema-gold text-cinema-gold-foreground text-[10px] font-bold px-2 py-0.5 rounded">COMING SOON</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex gap-2">
                  <button className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-background fill-background" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); addToList(item.id); }}
                    className="w-7 h-7 rounded-full border border-muted-foreground flex items-center justify-center hover:border-foreground"
                  >
                    <Plus className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button className="w-7 h-7 rounded-full border border-muted-foreground flex items-center justify-center hover:border-foreground">
                    <ThumbsUp className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">{item.genre} • {item.duration}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
