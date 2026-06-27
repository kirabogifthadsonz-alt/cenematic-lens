import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, Upload, Loader2, FolderOpen, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useVJList, useContentRows, useCategories } from "@/hooks/useAdminLists";

interface DetectedFile {
  name: string;
  path: string;
  link: string;
  season: number;
  part: number;
}

interface DropboxFolderUploadProps {
  open: boolean;
  onClose: () => void;
  allSeries: any[];
  onComplete: () => void;
}

export default function DropboxFolderUpload({ open, onClose, allSeries, onComplete }: DropboxFolderUploadProps) {
  const { vjNames } = useVJList();
  const { rows: contentRowsList } = useContentRows();
  const { categoryNames } = useCategories();
  const [folderUrl, setFolderUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [step, setStep] = useState<"url" | "configure" | "uploading">("url");

  // Series config
  const [contentType, setContentType] = useState<"series_intl" | "cinematic_original">("series_intl");
  const [seriesMode, setSeriesMode] = useState<"new" | "existing">("new");
  const [existingSeriesId, setExistingSeriesId] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("");
  const [vj, setVj] = useState("");
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const seriesRow = contentRowsList.find(r => r.name === (contentType === "cinematic_original" ? "Cinematic Lens Original" : "Series"));
  const row = seriesRow?.name || (contentType === "cinematic_original" ? "Cinematic Lens Original" : "Series");
  const price = seriesRow?.default_price ?? (contentType === "cinematic_original" ? 300 : 250);

  const filteredSeries = seriesSearch
    ? allSeries.filter(s => s.title.toLowerCase().includes(seriesSearch.toLowerCase()))
    : allSeries;

  const fetchFolder = async () => {
    if (!folderUrl.trim()) { toast.error("Paste a Dropbox folder link"); return; }
    setLoading(true);

    try {
      // Call edge function to list Dropbox folder contents
      const { data, error } = await supabase.functions.invoke("dropbox-stream", {
        body: { action: "list_folder", folder_url: folderUrl.trim() },
      });

      if (error) throw error;
      if (!data?.files?.length) { toast.error("No video files found in folder"); setLoading(false); return; }

      // Sort and assign part numbers
      const sorted = (data.files as any[])
        .filter((f: any) => /\.(mp4|mkv|avi|mov|webm)$/i.test(f.name))
        .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      const detected: DetectedFile[] = sorted.map((f: any, i: number) => ({
        name: f.name,
        path: f.path,
        link: f.link || "",
        season: 1,
        part: i + 1,
      }));

      setFiles(detected);
      setStep("configure");
      toast.success(`Found ${detected.length} video file(s)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to read folder");
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (seriesMode === "new" && !title.trim()) { toast.error("Series title required"); return; }
    if (seriesMode === "existing" && !existingSeriesId) { toast.error("Select a series"); return; }

    setUploading(true);
    setResults(null);
    setStep("uploading");

    let seriesId = existingSeriesId;
    let seriesTitle = title;
    let seriesThumb = thumbnailUrl;

    if (seriesMode === "new") {
      const { data: newSeries, error } = await supabase.from("series").insert({
        title, description: description || null, thumbnail_url: thumbnailUrl || null,
        category: category || null, vj: vj || null,
      }).select().single();
      if (error) { toast.error(error.message); setUploading(false); setStep("configure"); return; }
      seriesId = newSeries.id;
    } else {
      const existing = allSeries.find(s => s.id === existingSeriesId);
      if (existing) { seriesTitle = existing.title; if (!thumbnailUrl) seriesThumb = existing.thumbnail_url; }
    }

    let success = 0;
    const errors: string[] = [];

    for (const file of files) {
      const payload = {
        title: seriesTitle,
        description: description || null,
        thumbnail_url: seriesThumb || null,
        video_url: file.link || null,
        row,
        category: category || null,
        vj: vj || null,
        is_free: false,
        price_ugx: price,
        is_coming_soon: false,
        is_series: true,
        series_id: seriesId,
        season: file.season,
        part: file.part,
      };
      const { error } = await supabase.from("movies").insert(payload);
      if (error) errors.push(`Part ${file.part} (${file.name}): ${error.message}`);
      else success++;
    }

    setResults({ success, errors });
    setUploading(false);
    if (success > 0) { toast.success(`${success} episode(s) uploaded!`); onComplete(); }
  };

  const reset = () => {
    setStep("url"); setFolderUrl(""); setFiles([]); setTitle(""); setDescription("");
    setThumbnailUrl(""); setCategory(""); setVj(""); setResults(null);
    setSeriesMode("new"); setExistingSeriesId("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display">Dropbox Folder Upload</h2>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "url" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Paste a shared Dropbox folder link containing video files. The system will detect all videos and create episodes automatically.</p>
            <Input
              placeholder="https://www.dropbox.com/sh/... or https://www.dropbox.com/scl/fo/..."
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button onClick={fetchFolder} disabled={loading} className="w-full gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning folder...</> : <><FolderOpen className="w-4 h-4" /> Scan Folder</>}
            </Button>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-4">
            {/* Detected files */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-sm font-medium">Found {files.length} video file(s)</p>
              <div className="mt-2 max-h-[120px] overflow-y-auto space-y-1">
                {files.map(f => (
                  <div key={f.path} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground">Part {f.part}:</span> {f.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Series Type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Series Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={contentType === "series_intl"} onChange={() => setContentType("series_intl")} className="accent-primary" />
                  International — {price} UGX/ep
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={contentType === "cinematic_original"} onChange={() => setContentType("cinematic_original")} className="accent-primary" />
                  Cinematic Lens Original
                </label>
              </div>
            </div>

            {/* Series mode */}
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={seriesMode === "new"} onChange={() => setSeriesMode("new")} className="accent-primary" />
                  New Series
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={seriesMode === "existing"} onChange={() => setSeriesMode("existing")} className="accent-primary" />
                  Existing Series
                </label>
              </div>
              {seriesMode === "existing" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={seriesSearch} onChange={(e) => setSeriesSearch(e.target.value)} className="bg-secondary pl-8" />
                  </div>
                  <Select value={existingSeriesId} onValueChange={setExistingSeriesId}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select series..." /></SelectTrigger>
                    <SelectContent>{filteredSeries.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Metadata */}
            {seriesMode === "new" && (
              <>
                <Input placeholder="Series Title *" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary" />
                <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary" />
              </>
            )}
            <Input placeholder="Thumbnail URL (shared for all parts)" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="bg-secondary" />
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categoryNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={vj} onValueChange={setVj}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="VJ" /></SelectTrigger>
                  <SelectContent>{vjNames.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("url")}>Back</Button>
              <Button onClick={handleUpload} disabled={uploading} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4" /> Upload {files.length} Episodes
              </Button>
            </div>
          </div>
        )}

        {step === "uploading" && results && (
          <div className="space-y-4">
            {results.success > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" /> {results.success} episode(s) uploaded successfully
              </div>
            )}
            {results.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {err}
              </div>
            ))}
            <Button onClick={() => { onClose(); reset(); }} className="w-full">Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}
