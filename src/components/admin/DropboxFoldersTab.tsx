import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Trash2, Plus, FolderOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Folder = Tables<"dropbox_folders">;

export default function DropboxFoldersTab() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPath, setNewPath] = useState("");
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  const addFolder = async () => {
    if (!newPath.trim()) return;
    let path = newPath.trim();

    // Reject Dropbox URLs — these don't work with the API. User must give the folder PATH.
    if (/^https?:\/\//i.test(path) || path.includes("dropbox.com")) {
      toast.error(
        "Please enter the folder PATH (like /Movies), not the share URL. Open Dropbox → find your folder → its path is what comes after 'Dropbox' in the breadcrumb.",
        { duration: 8000 }
      );
      return;
    }

    // Normalize: must start with /, no trailing /
    if (!path.startsWith("/")) path = "/" + path;
    path = path.replace(/\/+$/, "");
    setAdding(true);
    const { error } = await supabase.from("dropbox_folders").insert({
      folder_path: path,
      folder_name: path.split("/").pop() || path,
    });
    setAdding(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Folder already added" : error.message);
    } else {
      toast.success("Folder added — click 'Sync Now' to import existing movies");
      setNewPath("");
    }
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dropbox Folders</h1>
          <p className="text-sm text-muted-foreground">
            Auto-imports new movies every 5 minutes • AI fills in poster, year, description
          </p>
        </div>
        <Button onClick={runSyncNow} disabled={syncing} className="gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync Now
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" /> Connect a new folder
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the Dropbox folder path (e.g. <code className="bg-secondary px-1 rounded">/Movies</code> or <code className="bg-secondary px-1 rounded">/Cinematic Lens/New</code>)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="/Movies"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFolder()}
              className="bg-secondary border-border"
            />
            <Button onClick={addFolder} disabled={adding || !newPath.trim()}>
              {adding ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {folders.length === 0 ? (
          <p className="text-muted-foreground text-center py-12 text-sm">
            No folders connected yet. Add one above to start auto-importing movies.
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
