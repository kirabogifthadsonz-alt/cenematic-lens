import { useState } from "react";
import { Link } from "react-router-dom";
import { useTitles } from "@/hooks/use-titles";
import { Loader2, Play, ChevronLeft } from "lucide-react";

const VJ_LIST = [
  "VJ Emmy", "VJ Junior", "VJ ICP", "VJ Mark", "VJ Ulio",
  "VJ Kevo", "VJ Uncle T", "VJ Isima K", "Others",
];

export default function VJs() {
  const { titles, loading } = useTitles();
  const [selectedVJ, setSelectedVJ] = useState<string | null>(null);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const filteredTitles = selectedVJ
    ? titles.filter(t => {
        if (selectedVJ === "Others") {
          return t.is_vj && t.status === "live" && !t.series_id && !VJ_LIST.slice(0, -1).includes(t.vj_narrator);
        }
        return t.vj_narrator === selectedVJ && t.status === "live" && !t.series_id;
      })
    : [];

  return (
    <div className="bg-background min-h-screen pt-20 pb-20 px-4 md:px-12">
      <h1 className="text-display text-3xl md:text-5xl mb-8">VJs</h1>

      {selectedVJ ? (
        <>
          <button onClick={() => setSelectedVJ(null)} className="flex items-center gap-2 text-primary mb-6 hover:underline">
            <ChevronLeft className="w-4 h-4" /> All VJs
          </button>
          <h2 className="text-display text-2xl mb-6">{selectedVJ}</h2>
          {filteredTitles.length === 0 ? (
            <p className="text-muted-foreground">No content found for {selectedVJ}.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredTitles.map(item => (
                <Link key={item.id} to={item.is_series ? `/series/${item.id}` : `/title/${item.id}`}
                  className="group relative rounded-md overflow-hidden bg-card hover:scale-105 transition-transform">
                  <div className="aspect-[2/3] bg-secondary relative">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-display text-sm text-muted-foreground text-center px-2">{item.title}</span>
                      </div>
                    )}
                    {!item.is_free && (
                      <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded shadow"
                        style={{ background: "linear-gradient(135deg, #FFD700, hsl(357 93% 47%))", color: "#fff" }}>
                        UGX {item.price.toLocaleString()}
                      </span>
                    )}
                    {item.is_free && (
                      <span className="absolute top-1.5 left-1.5 bg-cinema-gold text-cinema-gold-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">FREE</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                        <Play className="w-3 h-3 text-background fill-background" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.genre} • {item.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {VJ_LIST.map(vj => {
            const count = titles.filter(t => {
              if (vj === "Others") return t.is_vj && t.status === "live" && !t.series_id && !VJ_LIST.slice(0, -1).includes(t.vj_narrator);
              return t.vj_narrator === vj && t.status === "live" && !t.series_id;
            }).length;
            return (
              <button key={vj} onClick={() => setSelectedVJ(vj)}
                className="bg-card border border-border rounded-lg p-6 text-center hover:border-primary hover:bg-card/80 transition group">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition">
                  <span className="text-display text-2xl text-primary">{vj.replace("VJ ", "").charAt(0)}</span>
                </div>
                <p className="text-foreground font-semibold text-sm">{vj}</p>
                <p className="text-muted-foreground text-xs mt-1">{count} title{count !== 1 ? "s" : ""}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
