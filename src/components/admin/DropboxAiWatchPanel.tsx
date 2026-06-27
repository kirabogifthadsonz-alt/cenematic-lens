import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  X,
  FolderOpen,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import { useVJList, useContentRows, useCategories } from "@/hooks/useAdminLists";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingMovie {
  id: string;
  file_name: string;
  title: string;
  vj: string | null;
  description: string | null;
  category: string | null;
  year: number | null;
  thumbnail_url: string | null;
  poster_candidates: string[] | null;
  poster_source: string | null;
  poster_confidence: string | null;
  trailer_url: string | null;
  row: string;
  price_ugx: number;
  video_url: string | null;
  ai_status: string;
}

const POSTER_SOURCE_LABEL: Record<string, string> = {
  wikipedia_ai_verified: "Wikipedia ✓ AI-verified",
  itunes: "Apple iTunes",
  wikipedia_unverified: "Wikipedia (unverified)",
  none: "No source",
};

const POSTER_CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  none: "bg-muted text-muted-foreground border-border",
};

function PosterConfidenceBadge({ source, confidence }: { source: string | null; confidence: string | null }) {
  const conf = confidence || "none";
  const src = source || "none";
  const label = POSTER_SOURCE_LABEL[src] || src;
  const style = POSTER_CONFIDENCE_STYLE[conf] || POSTER_CONFIDENCE_STYLE.none;
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${style}`}>
      <span className="font-semibold uppercase tracking-wide">{conf}</span>
      <span className="opacity-80">· {label}</span>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function DropboxAiWatchPanel({ open, onClose, onComplete }: Props) {
  const { vjNames } = useVJList();
  const { rows } = useContentRows();
  const { categoryNames } = useCategories();

  const [folderUrl, setFolderUrl] = useState("");
  const [defaultRow, setDefaultRow] = useState("New Release");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [dropboxAccount, setDropboxAccount] = useState<"new" | "old">("new");
  const [savingSettings, setSavingSettings] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState<PendingMovie[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("dropbox_watch_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      setFolderUrl(data.folder_url || "");
      setDefaultRow(data.default_row || "New Release");
      setDefaultCategory(data.default_category || "");
      setDropboxAccount(data.dropbox_account || "new");
    }
  };

  const loadPending = async () => {
    const { data, error } = await supabase
      .from("pending_movies")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setPending((data || []) as any);
  };

  useEffect(() => {
    if (open) {
      loadSettings();
      loadPending();
    }
  }, [open]);

  const saveSettings = async () => {
    if (!folderUrl.trim()) {
      toast.error("Paste a Dropbox folder share link first");
      return;
    }
    setSavingSettings(true);
    const { error } = await supabase
      .from("dropbox_watch_settings")
      .upsert({
        id: 1,
        folder_url: folderUrl.trim(),
        default_row: defaultRow,
        default_category: defaultCategory || null,
        dropbox_account: dropboxAccount,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    setSavingSettings(false);
    if (error) toast.error(error.message);
    else toast.success("Watch folder saved ✓ You can now scan");
  };

  const scanNow = async () => {
    if (!folderUrl.trim()) {
      toast.error("Paste a Dropbox folder link and click Save first");
      return;
    }
    // Ensure latest settings are persisted before scanning
    await supabase.from("dropbox_watch_settings").upsert({
      id: 1,
      folder_url: folderUrl.trim(),
      default_row: defaultRow,
      default_category: defaultCategory || null,
      dropbox_account: dropboxAccount,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("dropbox-folder-scan", {
        body: {},
      });
      if (error) throw error;
      toast.success(
        `Scanned ${data?.scanned ?? 0} • Added ${data?.added ?? 0} • Skipped ${data?.skipped ?? 0}`,
      );
      await loadPending();
    } catch (e: any) {
      toast.error(e?.message || "Scan failed");
    }
    setScanning(false);
  };

  const updatePending = async (id: string, patch: Partial<PendingMovie>) => {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await supabase.from("pending_movies").update(patch).eq("id", id);
  };

  const deletePending = async (id: string) => {
    await supabase.from("pending_movies").delete().eq("id", id);
    setPending((p) => p.filter((m) => m.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map((p) => p.id)));
  };

  const publishSelected = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one movie");
      return;
    }
    setPublishing(true);
    let success = 0;
    const errors: string[] = [];

    for (const id of selected) {
      const m = pending.find((p) => p.id === id);
      if (!m) continue;
      const payload = {
        title: m.title,
        description: m.description,
        thumbnail_url: m.thumbnail_url,
        video_url: m.video_url,
        trailer_url: m.trailer_url,
        row: m.row,
        category: m.category,
        vj: m.vj,
        price_ugx: m.price_ugx,
        is_free: false,
        is_coming_soon: false,
        is_series: false,
      };
      const { error } = await supabase.from("movies").insert(payload);
      if (error) {
        errors.push(`${m.title}: ${error.message}`);
      } else {
        await supabase.from("pending_movies").delete().eq("id", id);
        success++;
      }
    }

    setPublishing(false);
    if (success > 0) {
      toast.success(`${success} movie(s) published`);
      onComplete();
      await loadPending();
      setSelected(new Set());
    }
    if (errors.length) toast.error(errors.slice(0, 3).join(" • "));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display">AI Watch Folder</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Settings */}
          <section className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Watched Dropbox folder</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a Dropbox shared folder link. Drop movies into this folder and click "Scan now"
              to AI-enrich them. Files named like <code>Avengers VJ Junior.mp4</code> auto-extract
              title and VJ.
            </p>
            <Input
              placeholder="https://www.dropbox.com/scl/fo/..."
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              className="bg-background"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Dropbox Account</Label>
                <Select value={dropboxAccount} onValueChange={(v) => setDropboxAccount(v as "new" | "old")}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    <SelectItem value="new">New Account</SelectItem>
                    <SelectItem value="old">Old Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Default row</Label>
                <Select value={defaultRow} onValueChange={setDefaultRow}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    {rows
                      .filter((r) => !r.is_series_row)
                      .map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Default category (fallback)</Label>
                <Select
                  value={defaultCategory || "__none__"}
                  onValueChange={(v) => setDefaultCategory(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    <SelectItem value="__none__">None</SelectItem>
                    {categoryNames.filter(Boolean).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={saveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save folder"}
              </Button>
              <Button
                size="sm"
                onClick={scanNow}
                disabled={scanning}
                className="gap-1 bg-primary hover:bg-primary/90"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" /> Scan now
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* Pending list */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Pending review ({pending.length})
              </h3>
              <div className="flex gap-2">
                {pending.length > 0 && (
                  <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                    {selected.size === pending.length ? "Unselect all" : "Select all"}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={publishSelected}
                  disabled={publishing || selected.size === 0}
                  className="gap-1 bg-gradient-to-r from-primary to-primary/70"
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Publish selected ({selected.size})
                </Button>
              </div>
            </div>

            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                No movies pending. Drop new files into the folder and click "Scan now".
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((m) => (
                  <div
                    key={m.id}
                    className="border border-border rounded-lg p-3 bg-secondary/20 flex gap-3"
                  >
                    <Checkbox
                      checked={selected.has(m.id)}
                      onCheckedChange={() => toggleSelect(m.id)}
                      className="mt-1"
                    />
                    {m.thumbnail_url ? (
                      <img
                        src={m.thumbnail_url}
                        alt={m.title}
                        className="w-16 h-24 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-muted rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      {editingId === m.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Title"
                              value={m.title}
                              onChange={(e) => updatePending(m.id, { title: e.target.value })}
                              className="bg-background"
                            />
                            <Input
                              placeholder="VJ"
                              value={m.vj || ""}
                              onChange={(e) => updatePending(m.id, { vj: e.target.value })}
                              className="bg-background"
                            />
                          </div>
                          <Input
                            placeholder="Description"
                            value={m.description || ""}
                            onChange={(e) => updatePending(m.id, { description: e.target.value })}
                            className="bg-background"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={m.row}
                              onValueChange={(v) => updatePending(m.id, { row: v })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[60]">
                                {rows
                                  .filter((r) => !r.is_series_row)
                                  .map((r) => (
                                    <SelectItem key={r.id} value={r.name}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={m.category || "__none__"}
                              onValueChange={(v) =>
                                updatePending(m.id, { category: v === "__none__" ? null : v })
                              }
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent className="z-[60]">
                                <SelectItem value="__none__">None</SelectItem>
                                {categoryNames.filter(Boolean).map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={m.vj || "__none__"}
                              onValueChange={(v) =>
                                updatePending(m.id, { vj: v === "__none__" ? null : v })
                              }
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="VJ" />
                              </SelectTrigger>
                              <SelectContent className="z-[60]">
                                <SelectItem value="__none__">None</SelectItem>
                                {vjNames.filter(Boolean).map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Poster picker */}
                          {m.poster_candidates && m.poster_candidates.length > 1 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Choose poster
                              </Label>
                              <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                                {m.poster_candidates.map((p, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => updatePending(m.id, { thumbnail_url: p })}
                                    className={`flex-shrink-0 rounded overflow-hidden border-2 ${
                                      m.thumbnail_url === p
                                        ? "border-primary"
                                        : "border-transparent"
                                    }`}
                                  >
                                    <img src={p} alt="" className="w-12 h-16 object-cover" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Done
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{m.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {m.vj ? `VJ ${m.vj} • ` : ""}
                                {m.year || "—"} • {m.category || "?"} • {m.row}
                              </div>
                              <div className="mt-1">
                                <PosterConfidenceBadge
                                  source={m.poster_source}
                                  confidence={m.poster_confidence}
                                />
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingId(m.id)}
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deletePending(m.id)}
                                className="p-1.5 rounded hover:bg-destructive/20 text-destructive"
                                title="Discard"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {m.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {m.description}
                            </p>
                          )}
                          <div className="text-[10px] text-muted-foreground/70 truncate">
                            {m.file_name}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
