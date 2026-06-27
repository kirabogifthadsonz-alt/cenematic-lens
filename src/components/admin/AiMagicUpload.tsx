import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { X, Sparkles, Loader2, Upload, Wand2, RefreshCw } from "lucide-react";
import { useVJList, useContentRows, useCategories } from "@/hooks/useAdminLists";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function AiMagicUpload({ open, onClose, onComplete }: Props) {
  const { vjNames } = useVJList();
  const { rows: contentRowsList } = useContentRows();
  const { categoryNames } = useCategories();

  const rowNames = contentRowsList.map(r => r.name);
  const rowPriceMap: Record<string, number> = {};
  contentRowsList.forEach(r => { rowPriceMap[r.name] = r.default_price; });

  const [step, setStep] = useState<"input" | "review">("input");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // form
  const [seedTitle, setSeedTitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [posterCandidates, setPosterCandidates] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [category, setCategory] = useState("");
  const [row, setRow] = useState("New Release");
  const [vj, setVJ] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [confidence, setConfidence] = useState<string>("");

  const reset = () => {
    setStep("input");
    setSeedTitle(""); setTitle(""); setDescription(""); setThumbnailUrl(""); setPosterCandidates([]);
    setVideoUrl(""); setTrailerUrl(""); setCategory(""); setRow("New Release"); setVJ("");
    setReleaseDate(""); setIsFree(false); setConfidence("");
  };

  const runAi = async (titleToUse?: string) => {
    const t = (titleToUse ?? seedTitle).trim();
    if (t.length < 2) { toast.error("Type a movie title first"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-movie-metadata", {
        body: { title: t, allowedCategories: categoryNames, allowedRows: rowNames, includePoster: true },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "AI failed");
      const meta = data.metadata as {
        description?: string; runtime_minutes?: number; category?: string;
        suggested_row?: string; year?: number; canonical_title?: string;
        poster_url?: string; poster_candidates?: string[]; trailer_url?: string; confidence?: string;
      };

      setTitle(meta.canonical_title || t);
      const runtimeLine = meta.runtime_minutes ? `\n\nRuntime: ${meta.runtime_minutes} min` : "";
      setDescription((meta.description || "") + runtimeLine);

      if (meta.category) {
        const match = categoryNames.find(c => c.toLowerCase() === meta.category!.toLowerCase());
        if (match) setCategory(match);
      }
      if (meta.suggested_row) {
        const matchRow = rowNames.find(r => r.toLowerCase() === meta.suggested_row!.toLowerCase());
        if (matchRow) setRow(matchRow);
      }
      if (meta.year && meta.year > 1880 && meta.year < 2100) {
        setReleaseDate(`${meta.year}-01-01`);
      }
      const candidates = Array.isArray(meta.poster_candidates) ? meta.poster_candidates : (meta.poster_url ? [meta.poster_url] : []);
      setPosterCandidates(candidates);
      if (candidates[0]) setThumbnailUrl(candidates[0]);
      if (meta.trailer_url) setTrailerUrl(meta.trailer_url);
      setConfidence(meta.confidence || "");

      setStep("review");
      const missing: string[] = [];
      if (!meta.poster_url) missing.push("poster");
      if (!meta.trailer_url) missing.push("trailer");
      toast.success(`AI ready${missing.length ? ` (no ${missing.join(" / ")} found — paste manually)` : ""}`);
    } catch (err: any) {
      toast.error(err.message || "AI lookup failed");
    } finally {
      setAiLoading(false);
    }
  };

  const reroll = async () => { await runAi(title || seedTitle); };

  const computedPrice = isFree || row === "Watch Free" ? 0 : (rowPriceMap[row] ?? 500);

  const save = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const { error } = await supabase.from("movies").insert({
      title: title.trim(),
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      video_url: videoUrl || null,
      trailer_url: trailerUrl || null,
      row,
      category: category || null,
      vj: vj || null,
      is_free: isFree || row === "Watch Free",
      price_ugx: computedPrice,
      is_coming_soon: row === "Coming Soon",
      is_series: false,
      release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Movie added!");
    onComplete();
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display">AI Magic Upload</h2>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === "input" && (
            <>
              <p className="text-sm text-muted-foreground">
                Just type the movie title. AI will fetch the official poster, description, category, year, and suggest a row. You can edit everything before saving.
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Movie title *</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Inception"
                  value={seedTitle}
                  onChange={(e) => setSeedTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !aiLoading) runAi(); }}
                  className="bg-secondary border-border"
                />
              </div>
              <Button
                onClick={() => runAi()}
                disabled={aiLoading || seedTitle.trim().length < 2}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Looking up…</> : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Poster sourced from Wikipedia · Metadata by Lovable AI
              </p>
            </>
          )}

          {step === "review" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Review & edit, then save. {confidence === "low" && <span className="text-destructive">⚠ Low confidence — please verify.</span>}
                </p>
                <Button size="sm" variant="outline" onClick={reroll} disabled={aiLoading} className="gap-1 h-7">
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Re-run AI
                </Button>
              </div>

              {/* Poster preview */}
              <div className="flex gap-3">
                <div className="w-24 h-36 rounded-lg bg-secondary border border-border overflow-hidden shrink-0">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center">
                      No poster found
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border h-9" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Poster URL</Label>
                    <Input
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://… (auto-filled from Wikipedia)"
                      className="bg-secondary border-border h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {posterCandidates.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">
                    Pick the clearest poster ({posterCandidates.length} candidates)
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {posterCandidates.map((url) => {
                      const selected = url === thumbnailUrl;
                      return (
                        <button
                          type="button"
                          key={url}
                          onClick={() => setThumbnailUrl(url)}
                          className={`relative aspect-[2/3] rounded-md overflow-hidden border-2 transition ${
                            selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/60"
                          }`}
                        >
                          <img
                            src={url}
                            alt="poster candidate"
                            loading="lazy"
                            className="w-full h-full object-cover bg-secondary"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                          />
                          {selected && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">✓</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-[11px] text-muted-foreground">Description</Label>
                <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{categoryNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Row</Label>
                  <Select value={row} onValueChange={setRow}>
                    <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent>{rowNames.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">VJ</Label>
                  <Select value={vj || "__none__"} onValueChange={(v) => setVJ(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select VJ" /></SelectTrigger>
                    <SelectContent className="z-[110] bg-popover">
                      <SelectItem value="__none__">— None —</SelectItem>
                      {vjNames.filter(v => v && v.trim().length > 0).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Release date</Label>
                  <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="bg-secondary border-border" />
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">YouTube trailer URL (auto-filled by AI — used for homepage preview)</Label>
                <Input value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className="bg-secondary border-border h-9 text-xs" />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Video URL (1080p) — supports Dropbox, pCloud, OneDrive. Optional now, can add later</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://… (Dropbox / pCloud share link)" className="bg-secondary border-border" />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="ai-free" checked={isFree} onCheckedChange={(c) => setIsFree(!!c)} />
                <Label htmlFor="ai-free" className="text-sm">Free movie</Label>
                <span className="ml-auto text-xs text-muted-foreground">Price: {computedPrice} UGX</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep("input")} className="flex-1">Back</Button>
                <Button onClick={save} disabled={saving} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Upload className="w-4 h-4" /> Save Movie</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
