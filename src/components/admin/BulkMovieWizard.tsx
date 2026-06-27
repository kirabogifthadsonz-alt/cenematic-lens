import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { X, Plus, Trash2, Upload, Loader2, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useVJList, useContentRows, useCategories } from "@/hooks/useAdminLists";

interface MovieEntry {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoUrl720p: string;
  videoUrl480p: string;
  row: string;
  category: string;
  vj: string;
  isFree: boolean;
}

let counter = 0;
const makeId = () => `bm-${++counter}-${Date.now()}`;

interface BulkMovieWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function BulkMovieWizard({ open, onClose, onComplete }: BulkMovieWizardProps) {
  const { vjNames } = useVJList();
  const { rows: contentRowsList } = useContentRows();
  const { categoryNames } = useCategories();
  const [step, setStep] = useState(1);
  const [movies, setMovies] = useState<MovieEntry[]>([{
    id: makeId(), title: "", description: "", thumbnailUrl: "",
    videoUrl: "", videoUrl720p: "", videoUrl480p: "",
    row: "New Release", category: "", vj: "", isFree: false,
  }]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const current = movies[currentIdx];
  const rowNames = contentRowsList.map(r => r.name);
  const rowPriceMap: Record<string, number> = {};
  contentRowsList.forEach(r => { rowPriceMap[r.name] = r.default_price; });

  const getPrice = (m: MovieEntry) => {
    if (m.isFree || m.row === "Watch Free") return 0;
    return rowPriceMap[m.row] ?? 500;
  };

  const updateCurrent = (field: keyof MovieEntry, value: any) => {
    setMovies(movies.map((m, i) => i === currentIdx ? { ...m, [field]: value } : m));
  };

  const addMovie = () => {
    setMovies([...movies, {
      id: makeId(), title: "", description: "", thumbnailUrl: "",
      videoUrl: "", videoUrl720p: "", videoUrl480p: "",
      row: "New Release", category: "", vj: "", isFree: false,
    }]);
    setCurrentIdx(movies.length);
  };

  const removeMovie = (idx: number) => {
    if (movies.length <= 1) return;
    const updated = movies.filter((_, i) => i !== idx);
    setMovies(updated);
    if (currentIdx >= updated.length) setCurrentIdx(updated.length - 1);
    else if (currentIdx > idx) setCurrentIdx(currentIdx - 1);
  };

  const handleUpload = async () => {
    const invalid = movies.filter(m => !m.title.trim());
    if (invalid.length > 0) { toast.error("All movies need a title"); return; }

    setUploading(true);
    setResults(null);
    let success = 0;
    const errors: string[] = [];

    for (const m of movies) {
      const payload = {
        title: m.title,
        description: m.description || null,
        thumbnail_url: m.thumbnailUrl || null,
        video_url: m.videoUrl || null,
        video_url_720p: m.videoUrl720p || null,
        video_url_480p: m.videoUrl480p || null,
        row: m.row,
        category: m.category || null,
        vj: m.vj || null,
        is_free: m.isFree || m.row === "Watch Free",
        price_ugx: getPrice(m),
        is_coming_soon: m.row === "Coming Soon",
        is_series: false,
      };
      const { error } = await supabase.from("movies").insert(payload);
      if (error) errors.push(`${m.title}: ${error.message}`);
      else success++;
    }

    setResults({ success, errors });
    setUploading(false);
    if (success > 0) {
      toast.success(`${success} movie(s) uploaded!`);
      onComplete();
    }
  };

  const reset = () => {
    setStep(1);
    setCurrentIdx(0);
    setMovies([{
      id: makeId(), title: "", description: "", thumbnailUrl: "",
      videoUrl: "", videoUrl720p: "", videoUrl480p: "",
      row: "New Release", category: "", vj: "", isFree: false,
    }]);
    setResults(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display">Bulk Movie Upload</h2>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Step 1: How many movies?</h3>
              <p className="text-xs text-muted-foreground mb-3">Add movie entries, then fill details in the next steps.</p>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {movies.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-secondary/30">
                  <span className="text-xs font-medium w-6 text-center">{i + 1}</span>
                  <Input
                    placeholder="Movie title *"
                    value={m.title}
                    onChange={(e) => setMovies(movies.map((mv, j) => j === i ? { ...mv, title: e.target.value } : mv))}
                    className="bg-secondary border-border h-8 text-sm flex-1"
                  />
                  {movies.length > 1 && (
                    <button onClick={() => removeMovie(i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addMovie} className="gap-1">
              <Plus className="w-3 h-3" /> Add Another Movie
            </Button>
            <Button onClick={() => {
              if (movies.every(m => m.title.trim())) { setStep(2); setCurrentIdx(0); }
              else toast.error("All movies need a title");
            }} className="w-full gap-1">
              Next: Details <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 2 && current && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Step 2: Movie Details ({currentIdx + 1}/{movies.length})</h3>
              <span className="text-sm font-bold text-primary">{current.title}</span>
            </div>
            <Input placeholder="Description" value={current.description} onChange={(e) => updateCurrent("description", e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Thumbnail URL" value={current.thumbnailUrl} onChange={(e) => updateCurrent("thumbnailUrl", e.target.value)} className="bg-secondary border-border" />
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={current.category} onValueChange={(v) => updateCurrent("category", v)}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categoryNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={current.vj} onValueChange={(v) => updateCurrent("vj", v)}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="VJ" /></SelectTrigger>
                  <SelectContent>{vjNames.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Select value={current.row} onValueChange={(v) => updateCurrent("row", v)}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Row" /></SelectTrigger>
              <SelectContent>{rowNames.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox checked={current.isFree} onCheckedChange={(c) => updateCurrent("isFree", !!c)} id={`free-${currentIdx}`} />
              <Label htmlFor={`free-${currentIdx}`} className="text-sm">Free movie</Label>
              <span className="ml-auto text-xs text-muted-foreground">Price: {getPrice(current)} UGX</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); else setStep(1); }} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => {
                if (currentIdx < movies.length - 1) setCurrentIdx(currentIdx + 1);
                else setStep(3);
              }} className="flex-1 gap-1">
                {currentIdx < movies.length - 1 ? "Next Movie" : "Next: Video URLs"} <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 3: Video URLs ({currentIdx + 1}/{movies.length})</h3>
            <span className="text-sm font-bold text-primary">{movies[currentIdx]?.title}</span>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">1080p Video URL *</Label>
                <Input placeholder="https://..." value={movies[currentIdx]?.videoUrl} onChange={(e) => updateCurrent("videoUrl", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">720p (optional)</Label>
                <Input placeholder="https://..." value={movies[currentIdx]?.videoUrl720p} onChange={(e) => updateCurrent("videoUrl720p", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">480p (optional)</Label>
                <Input placeholder="https://..." value={movies[currentIdx]?.videoUrl480p} onChange={(e) => updateCurrent("videoUrl480p", e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
                else { setStep(2); setCurrentIdx(movies.length - 1); }
              }} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              {currentIdx < movies.length - 1 ? (
                <Button onClick={() => setCurrentIdx(currentIdx + 1)} className="flex-1 gap-1">
                  Next Movie <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleUpload} disabled={uploading} className="flex-1 gap-1 bg-primary hover:bg-primary/90">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload All ({movies.length})</>}
                </Button>
              )}
            </div>

            {results && (
              <div className="space-y-2 mt-3">
                {results.success > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" /> {results.success} movie(s) uploaded
                  </div>
                )}
                {results.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {err}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
