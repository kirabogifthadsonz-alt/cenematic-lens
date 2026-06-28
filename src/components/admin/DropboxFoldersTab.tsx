import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Trash2, FolderOpen, CheckCircle2, ChevronRight, Home, Plus } from "lucide-react";
import { toast } from "sonner";

type Folder = Tables<"dropbox_folders">;
interface DbxFolder { name: string; path: string }

export default function DropboxFoldersTab() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Dropbox browser state
  const [browserPath, setBrowserPath] = useState<string>("");
  const [browserItems, setBrowserItems] = useState<DbxFolder[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserError, setBrowserError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("dropbox_folders").select("*").order("created_at", { ascending: false });
      setFolders(data || []);
      setLoading(false);
    };
    load();
    const ch = supabase.channel("dbx-folders").on(
      "postgres_changes", { event: "*", schema: "public", table: "dropbox_folders" }, load
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const loadDropbox = async (path: string) => {
    setBrowserLoading(true);
    setBrowserError(null);
    try {
      const { data, error } = await supabase.functions.invoke("dropbox-sync", {
        body: { action: "list_folders", path },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to list folders");
      setBrowserItems(data.folders || []);
      setBrowserPath(path);
    } catch (e: any) {
      setBrowserError(e.message || "Failed to load Dropbox folders");
      setBrowserItems([]);
    }
    setBrowserLoading(false);
  };

  useEffect(() => { loadDropbox(""); }, []);

  const isConnected = (path: string) => folders.some(f => f.folder_path.toLowerCase() === path.toLowerCase());

  const connectFolder = async (item: DbxFolder) => {
    if (isConnected(item.path)) { toast.info("Already connected"); return; }
    const { error } = await supabase.from("dropbox_folders").insert({
      folder_path: item.path,
      folder_name: item.name,
    });
    if (error) toast.error(error.message);
    else toast.success(`Connected "${item.name}" — click Sync Now to import`);
  };

  const removeFolder = async (id: string) => {
    await supabase.from("dropbox_folders").delete().eq("id", id);
    toast.success("Folder removed");
  };

  const toggleEnabled = async (f: Folder) => {
    await supabase.from("dropbox_folders").update({ enabled: !f.enabled }).eq("id", f.id);
  };

  const runSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("dropbox-sync");
      if (error) throw error;
      const totalNew = (data?.results || []).reduce((s: number, r: any) => s + (r.new || 0), 0);
      toast.success(`Sync complete — ${totalNew} new movie(s) added to review queue`);
    } catch (e: any) {
      toast.error("Sync failed: " + (e.message || "unknown error"));
    }
    setSyncing(false);
  };

  // Breadcrumb segments
  const segments = browserPath.split("/").filter(Boolean);
  const breadcrumb = [{ label: "Dropbox", path: "" }, ...segments.map((seg, i) => ({
    label: seg, path: "/" + segments.slice(0, i + 1).join("/"),
  }))];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dropbox Folders</h1>
          <p className="text-sm text-muted-foreground">
            Browse your Dropbox below and click a folder to connect it. Auto-syncs every 5 minutes.
          </p>
        </div>
        <Button onClick={runSyncNow} disabled={syncing} className="gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync Now
        </Button>
      </div>

      {/* Dropbox folder browser */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-1 text-sm flex-wrap">
            {breadcrumb.map((b, i) => (
              <div key={b.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <button
                  onClick={() => loadDropbox(b.path)}
                  className={`px-2 py-0.5 rounded hover:bg-secondary transition flex items-center gap-1 ${
                    i === breadcrumb.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {i === 0 && <Home className="w-3.5 h-3.5" />}
                  {b.label}
                </button>
              </div>
            ))}
            <Button
              variant="ghost" size="sm"
              onClick={() => loadDropbox(browserPath)}
              className="ml-auto h-7 px-2 gap-1 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${browserLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {browserError && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">
              {browserError}
            </div>
          )}

          {browserLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : browserItems.length === 0 && !browserError ? (
            <p className="text-xs text-muted-foreground text-center py-6">No sub-folders here.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {browserItems.map((item) => {
                const connected = isConnected(item.path);
                return (
                  <div key={item.path} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition group">
                    <button
                      onClick={() => loadDropbox(item.path)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm truncate">{item.name}</span>
                    </button>
                    {connected ? (
                      <span className="text-[10px] text-green-500 font-semibold uppercase flex items-center gap-1 px-2">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => connectFolder(item)} className="h-7 px-2 gap-1 text-xs">
                        <Plus className="w-3 h-3" /> Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected folders */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Connected Folders</h2>
        {folders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No folders connected yet. Click "Connect" on a folder above to start auto-importing.
          </p>
        ) : folders.map((f) => (
          <Card key={f.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FolderOpen className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.folder_path}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.last_synced_at
                      ? <>Last synced {new Date(f.last_synced_at).toLocaleString()} <CheckCircle2 className="inline w-3 h-3 text-green-500 ml-1" /></>
                      : "Never synced yet"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={f.enabled} onChange={() => toggleEnabled(f)} />
                  {f.enabled ? "On" : "Off"}
                </label>
                <Button variant="ghost" size="icon" onClick={() => removeFolder(f.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
