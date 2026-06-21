import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, X, Sparkles, Edit2, Save, Globe } from "lucide-react";
import { toast } from "sonner";
import FileUploader from "@/components/admin/FileUploader";

type Pending = Tables<"pending_imports">;

export default function PendingReviewTab() {
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Pending>>({});
  const [publishingAll, setPublishingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pending_imports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    load();
    const ch = supabase.channel("pending-imports").on(
      "postgres_changes", { event: "*", schema: "public", table: "pending_imports" }, load
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const startEdit = (it: Pending) => {
    setEditingId(it.id);
    setDraft({
      parsed_title: it.parsed_title,
      parsed_vj: it.parsed_vj,
      description: it.description,
      year: it.year,
      duration: it.duration,
      genre: it.genre,
      category: it.category,
      thumbnail_url: it.thumbnail_url,
      language: it.language,
      rating: it.rating,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from("pending_imports").update(draft).eq("id", editingId);
    toast.success("Saved");
    setEditingId(null);
  };

  const publishOne = async (it: Pending) => {
    const { error } = await supabase.from("titles").insert({
      title: it.parsed_title,
      description: it.description,
      thumbnail: it.thumbnail_url,
      thumbnail_url: it.thumbnail_url,
      video_url: it.video_url,
      genre: it.genre,
      language: it.language,
      year: it.year,
      duration: it.duration,
      rating: it.rating,
      category: it.category,
      vj_narrator: it.parsed_vj,
      is_vj: !!it.parsed_vj,
      is_free: false,
      is_series: false,
      status: "live",
      price: 400,
      row: "trending",
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("pending_imports").update({ status: "published" }).eq("id", it.id);
    toast.success(`Published: ${it.parsed_title}`);
  };

  const publishAll = async () => {
    if (!confirm(`Publish all ${items.length} pending movies?`)) return;
    setPublishingAll(true);
    let ok = 0, fail = 0;
    for (const it of items) {
      try { await publishOne(it); ok++; } catch { fail++; }
    }
    setPublishingAll(false);
    toast.success(`Published ${ok}${fail ? `, ${fail} failed` : ""}`);
  };

  const reject = async (id: string) => {
    await supabase.from("pending_imports").update({ status: "rejected" }).eq("id", id);
    toast.success("Rejected");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Review Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} movie{items.length !== 1 && "s"} waiting — AI pre-filled everything, just verify and publish
          </p>
        </div>
        {items.length > 0 && (
          <Button onClick={publishAll} disabled={publishingAll} className="gap-2">
            {publishingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Publish All ({items.length})
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">
          Nothing to review. Drop a movie in your connected Dropbox folder and it'll appear here within 5 minutes.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it) => {
            const isEditing = editingId === it.id;
            const v = isEditing ? { ...it, ...draft } : it;
            return (
              <Card key={it.id} className="bg-card border-border overflow-hidden">
                <div className="flex">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt="" className="w-24 h-36 object-cover flex-shrink-0 bg-secondary" />
                  ) : (
                    <div className="w-24 h-36 bg-secondary flex-shrink-0 flex items-center justify-center text-[9px] text-muted-foreground text-center p-1">No poster</div>
                  )}
                  <CardContent className="p-3 flex-1 min-w-0 space-y-2">
                    {!it.tmdb_matched && (
                      <p className="text-[10px] text-yellow-500">⚠ Not matched on TMDB — please verify</p>
                    )}

                    {isEditing ? (
                      <>
                        <Input value={v.parsed_title || ""} onChange={(e) => setDraft(d => ({ ...d, parsed_title: e.target.value }))} placeholder="Title" className="bg-secondary border-border h-8 text-sm" />
                        <Input value={v.parsed_vj || ""} onChange={(e) => setDraft(d => ({ ...d, parsed_vj: e.target.value }))} placeholder="VJ" className="bg-secondary border-border h-8 text-sm" />
                        <div className="grid grid-cols-2 gap-1.5">
                          <Input type="number" value={v.year || 2025} onChange={(e) => setDraft(d => ({ ...d, year: +e.target.value }))} placeholder="Year" className="bg-secondary border-border h-8 text-xs" />
                          <Input value={v.duration || ""} onChange={(e) => setDraft(d => ({ ...d, duration: e.target.value }))} placeholder="Duration" className="bg-secondary border-border h-8 text-xs" />
                        </div>
                        <Input value={v.genre || ""} onChange={(e) => setDraft(d => ({ ...d, genre: e.target.value }))} placeholder="Genre" className="bg-secondary border-border h-8 text-xs" />
                        <Input value={(v.category || []).join(", ")} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} placeholder="Categories (comma-separated)" className="bg-secondary border-border h-8 text-xs" />
                        <Input value={v.thumbnail_url || ""} onChange={(e) => setDraft(d => ({ ...d, thumbnail_url: e.target.value }))} placeholder="Poster URL" className="bg-secondary border-border h-8 text-xs" />
                        <Textarea value={v.description || ""} onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description" className="bg-secondary border-border text-xs min-h-[60px]" />
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm text-foreground truncate">{v.parsed_title || "—"}</p>
                        {v.parsed_vj && <p className="text-xs text-primary">VJ {v.parsed_vj}</p>}
                        <p className="text-[10px] text-muted-foreground">{v.year} · {v.duration} · {v.genre}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-3">{v.description || "No description"}</p>
                        <div className="flex flex-wrap gap-1">
                          {(v.category || []).map((c: string) => (
                            <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary">{c}</span>
                          ))}
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate" title={it.original_filename}>📁 {it.original_filename}</p>
                      </>
                    )}

                    <div className="flex gap-1 pt-1">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={saveEdit} className="h-7 text-xs gap-1 flex-1"><Save className="w-3 h-3" />Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs">Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => publishOne(it)} className="h-7 text-xs gap-1 flex-1"><CheckCircle2 className="w-3 h-3" />Publish</Button>
                          <Button size="sm" variant="outline" onClick={() => startEdit(it)} className="h-7 text-xs"><Edit2 className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(it.id)} className="h-7 text-xs"><X className="w-3 h-3 text-destructive" /></Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
