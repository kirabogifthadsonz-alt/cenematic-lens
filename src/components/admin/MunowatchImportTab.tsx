import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Film, Tv, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Munowatch grid pipe IDs (from their nav HTML)
const PIPES = [
  { label: "Latest Movies", pipe_type: "p", pipe_id: "4", icon: Film },
  { label: "Series", pipe_type: "g", pipe_id: "5", icon: Tv },
];

export default function MunowatchImportTab() {
  const [pipe, setPipe] = useState(PIPES[0]);
  const [maxPages, setMaxPages] = useState(1);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const runImport = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("munowatch-import", {
        body: {},
        // pass via query string-ish — edge function reads URL params
      });
      // Pass params via a custom URL fetch since invoke doesn't support search params cleanly:
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/munowatch-import?pipe_type=${pipe.pipe_type}&pipe_id=${pipe.pipe_id}&max_pages=${maxPages}`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const j = await r.json();
      setLastResult(j);
      if (j.success) {
        toast.success(`Imported ${j.queued} new movies (${j.skipped} already in queue)`);
      } else {
        toast.error(j.error || "Import failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" /> Munowatch Catalog Importer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pull movie metadata + posters from Munowatch into your review queue. Videos are NOT imported — you upload those separately via Dropbox or Telegram.
        </p>
      </div>

      <Card className="bg-yellow-500/5 border-yellow-500/30">
        <CardContent className="pt-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Rate-limited:</strong> 1.5s between movies, ~30 movies/min. A full catalog scan will take a while — start with 1 page.</p>
            <p><strong className="text-foreground">Posters mirrored:</strong> downloaded to your own storage so they keep working even if Munowatch changes URLs.</p>
            <p><strong className="text-foreground">No duplicates:</strong> already-imported movies are skipped automatically.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Run Import</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Catalog</Label>
            <div className="flex gap-2 flex-wrap">
              {PIPES.map(p => {
                const Icon = p.icon;
                return (
                  <Button
                    key={p.label}
                    type="button"
                    variant={pipe.label === p.label ? "default" : "outline"}
                    onClick={() => setPipe(p)}
                    className="gap-2"
                    size="sm"
                  >
                    <Icon className="w-4 h-4" /> {p.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Pages to import (1 page ≈ 20-30 movies)</Label>
            <Input
              type="number" min={1} max={20}
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, Math.min(20, +e.target.value || 1)))}
              className="bg-secondary border-border w-32"
            />
          </div>

          <Button onClick={runImport} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {running ? "Importing… (don't close this tab)" : `Import ${pipe.label}`}
          </Button>
        </CardContent>
      </Card>

      {lastResult && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Last Run</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-secondary p-3 rounded overflow-auto">{JSON.stringify(lastResult, null, 2)}</pre>
            {lastResult.queued > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                ✓ Head to <strong className="text-primary">Review Queue</strong> to verify and publish.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
