import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, Plus, Trash2, Search, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useVJList, useContentRows, useCategories } from "@/hooks/useAdminLists";

interface Episode {
  id: string;
  season: number;
  part: number;
  videoUrl: string;
  videoUrl720p: string;
  videoUrl480p: string;
}

interface BulkSeriesUploadProps {
  open: boolean;
  onClose: () => void;
  allSeries: any[];
  onComplete: () => void;
}

let episodeCounter = 0;
const makeId = () => `ep-${++episodeCounter}-${Date.now()}`;

export default function BulkSeriesUpload({ open, onClose, allSeries, onComplete }: BulkSeriesUploadProps) {
  const { vjNames } = useVJList();
  const { rows: contentRowsList } = useContentRows();
  const { categoryNames } = useCategories();
  const [contentType, setContentType] = useState<"series_intl" | "cinematic_original">("series_intl");
  const [seriesMode, setSeriesMode] = useState<"new" | "existing">("new");
  const [existingSeriesId, setExistingSeriesId] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");

  // Shared metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("");
  const [vj, setVj] = useState("");

  // Episodes
  const [addCount, setAddCount] = useState("5");
  const [episodes, setEpisodes] = useState<Episode[]>([
    { id: makeId(), season: 1, part: 1, videoUrl: "", videoUrl720p: "", videoUrl480p: "" },
  ]);

  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const CATEGORIES = categoryNames;
  const VJS = vjNames;

  const seriesRow = contentRowsList.find(r => r.name === (contentType === "cinematic_original" ? "Cinematic Lens Original" : "Series"));
  const row = seriesRow?.name || (contentType === "cinematic_original" ? "Cinematic Lens Original" : "Series");
  const price = seriesRow?.default_price ?? (contentType === "cinematic_original" ? 300 : 250);

  const filteredSeries = useMemo(() => {
    if (!seriesSearch) return allSeries;
    return allSeries.filter(s => s.title.toLowerCase().includes(seriesSearch.toLowerCase()));
  }, [allSeries, seriesSearch]);

  const addEpisode = () => {
    const last = episodes[episodes.length - 1];
    setEpisodes([...episodes, {
      id: makeId(),
      season: last?.season || 1,
      part: (last?.part || 0) + 1,
      videoUrl: "",
      videoUrl720p: "",
      videoUrl480p: "",
    }]);
  };

  const addMultipleEpisodes = () => {
    const count = parseInt(addCount) || 0;
    if (count < 1 || count > 100) { toast.error("Enter a number between 1 and 100"); return; }
    const last = episodes[episodes.length - 1];
    const startPart = (last?.part || 0) + 1;
    const startSeason = last?.season || 1;
    const newEps: Episode[] = Array.from({ length: count }, (_, i) => ({
      id: makeId(),
      season: startSeason,
      part: startPart + i,
      videoUrl: "",
      videoUrl720p: "",
      videoUrl480p: "",
    }));
    setEpisodes([...episodes, ...newEps]);
  };

  const removeEpisode = (id: string) => {
    if (episodes.length <= 1) return;
    setEpisodes(episodes.filter(e => e.id !== id));
  };

  const updateEpisode = (id: string, field: keyof Episode, value: string | number) => {
    setEpisodes(episodes.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleUpload = async () => {
    if (!title.trim() && seriesMode === "new") {
      toast.error("Series title is required");
      return;
    }
    if (seriesMode === "existing" && !existingSeriesId) {
      toast.error("Please select an existing series");
      return;
    }
    if (episodes.some(e => !e.videoUrl.trim())) {
      toast.error("All episodes need at least a 1080p video URL");
      return;
    }

    setUploading(true);
    setResults(null);

    let seriesId = existingSeriesId;
    let seriesTitle = title;
    let seriesThumb = thumbnailUrl;

    // Create new series if needed
    if (seriesMode === "new") {
      const { data: newSeries, error: seriesErr } = await supabase.from("series").insert({
        title,
        description: description || null,
        thumbnail_url: thumbnailUrl || null,
        category: category || null,
        vj: vj || null,
      }).select().single();

      if (seriesErr) {
        toast.error(`Failed to create series: ${seriesErr.message}`);
        setUploading(false);
        return;
      }
      seriesId = newSeries.id;
    } else {
      const existing = allSeries.find(s => s.id === existingSeriesId);
      if (existing) {
        seriesTitle = existing.title;
        if (!thumbnailUrl) seriesThumb = existing.thumbnail_url;
      }
    }

    let success = 0;
    const errors: string[] = [];

    for (const ep of episodes) {
      const payload = {
        title: seriesTitle,
        description: description || null,
        thumbnail_url: seriesThumb || null,
        video_url: ep.videoUrl || null,
        video_url_720p: ep.videoUrl720p || null,
        video_url_480p: ep.videoUrl480p || null,
        row,
        category: category || null,
        vj: vj || null,
        is_free: false,
        price_ugx: price,
        is_coming_soon: false,
        is_series: true,
        series_id: seriesId,
        season: ep.season,
        part: ep.part,
      };

      const { error } = await supabase.from("movies").insert(payload);
      if (error) {
        errors.push(`S${ep.season}E${ep.part}: ${error.message}`);
      } else {
        success++;
      }
    }

    setResults({ success, errors });
    setUploading(false);

    if (success > 0) {
      toast.success(`${success} episode(s) uploaded successfully!`);
      onComplete();
    }
  };

  const reset = () => {
    setContentType("series_intl");
    setSeriesMode("new");
    setExistingSeriesId("");
    setSeriesSearch("");
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setCategory("");
    setVj("");
    setEpisodes([{ id: makeId(), season: 1, part: 1, videoUrl: "", videoUrl720p: "", videoUrl480p: "" }]);
    setResults(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display">Bulk Series Upload</h2>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Series Type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Series Type</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="bulkContentType" value="series_intl" checked={contentType === "series_intl"} onChange={() => setContentType("series_intl")} className="accent-primary" />
                Series (Hollywood & International) — 250 UGX/ep
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="bulkContentType" value="cinematic_original" checked={contentType === "cinematic_original"} onChange={() => setContentType("cinematic_original")} className="accent-primary" />
                Cinematic Lens Original (Ugandan) — 300 UGX/ep
              </label>
            </div>
          </div>

          {/* New or Existing Series */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Series</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="bulkSeriesMode" value="new" checked={seriesMode === "new"} onChange={() => setSeriesMode("new")} className="accent-primary" />
                Create New Series
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="bulkSeriesMode" value="existing" checked={seriesMode === "existing"} onChange={() => setSeriesMode("existing")} className="accent-primary" />
                Add to Existing Series
              </label>
            </div>

            {seriesMode === "existing" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search series..." value={seriesSearch} onChange={(e) => setSeriesSearch(e.target.value)} className="bg-secondary border-border pl-8" />
                </div>
                <Select value={existingSeriesId} onValueChange={setExistingSeriesId}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select series..." /></SelectTrigger>
                  <SelectContent>
                    {filteredSeries.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Shared Metadata */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shared Details</Label>
            {seriesMode === "new" && (
              <>
                <Input placeholder="Series Title *" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" />
              </>
            )}
            <Input placeholder="Thumbnail URL (shared for all episodes)" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="bg-secondary border-border" />
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={vj} onValueChange={setVj}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="VJ Narrator" /></SelectTrigger>
                  <SelectContent>{VJS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Episodes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Episodes ({episodes.length})
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min="1" max="100" value={addCount}
                    onChange={(e) => setAddCount(e.target.value)}
                    className="bg-secondary border-border h-7 w-14 text-xs text-center"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addMultipleEpisodes} className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Add Multiple
                  </Button>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={addEpisode} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> +1
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {episodes.map((ep, idx) => (
                <div key={ep.id} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Episode {idx + 1}</span>
                    {episodes.length > 1 && (
                      <button onClick={() => removeEpisode(ep.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20">
                      <Label className="text-[10px] text-muted-foreground">Season</Label>
                      <Input
                        type="number" min="1" value={ep.season}
                        onChange={(e) => updateEpisode(ep.id, "season", parseInt(e.target.value) || 1)}
                        className="bg-secondary border-border h-8 text-xs"
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-[10px] text-muted-foreground">Part</Label>
                      <Input
                        type="number" min="1" value={ep.part}
                        onChange={(e) => updateEpisode(ep.id, "part", parseInt(e.target.value) || 1)}
                        className="bg-secondary border-border h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Video URL 1080p *</Label>
                      <Input
                        placeholder="https://..."
                        value={ep.videoUrl}
                        onChange={(e) => updateEpisode(ep.id, "videoUrl", e.target.value)}
                        className="bg-secondary border-border h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">720p (optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={ep.videoUrl720p}
                        onChange={(e) => updateEpisode(ep.id, "videoUrl720p", e.target.value)}
                        className="bg-secondary border-border h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">480p (optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={ep.videoUrl480p}
                        onChange={(e) => updateEpisode(ep.id, "videoUrl480p", e.target.value)}
                        className="bg-secondary border-border h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
            <p className="font-medium text-foreground">Upload Summary</p>
            <p className="text-xs text-muted-foreground mt-1">
              {episodes.length} episode(s) → <span className="text-foreground font-medium">{row}</span> at <span className="text-foreground font-medium">{price} UGX</span>/ep
            </p>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-2">
              {results.success > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" /> {results.success} episode(s) uploaded
                </div>
              )}
              {results.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {err}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleUpload} disabled={uploading} className="bg-primary hover:bg-primary/90 flex-1 gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload All Episodes</>}
            </Button>
            <Button variant="secondary" onClick={() => { onClose(); reset(); }}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
