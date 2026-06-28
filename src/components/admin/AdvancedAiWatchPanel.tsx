import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Zap,
  Trash2,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Tag,
  X,
} from "lucide-react";

interface PendingMovie {
  id: string;
  movie_title: string;
  production_year: number | null;
  description: string | null;
  poster_url: string | null;
  vj_name: string | null;
  category: string | null;
  is_finished: boolean;
  dropbox_file_id: string | null;
  custom_poster_url: string | null;
  custom_category: string | null;
  preparation_notes: string | null;
  video_url?: string | null;
  video_url_720p?: string | null;
  video_url_480p?: string | null;
  last_edited_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function AdvancedAiWatchPanel({ open, onClose, onComplete }: Props) {
  const [folderUrl, setFolderUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [movies, setMovies] = useState<PendingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PendingMovie>>({});

  useEffect(() => {
    if (open) {
      loadPendingMovies();
    }
  }, [open]);

  const loadPendingMovies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pending_movies")
        .select("*")
        .eq("dropbox_account", "new")
        .order("is_finished", { ascending: true })
        .order("last_edited_at", { ascending: false });

      if (error) throw error;
      setMovies((data || []) as PendingMovie[]);
    } catch (err) {
      console.error("Error loading pending movies:", err);
      toast.error("Failed to load pending movies");
    } finally {
      setLoading(false);
    }
  };

  const scanFolder = async () => {
    if (!folderUrl.trim()) {
      toast.error("Please enter a Dropbox folder URL");
      return;
    }

    setScanning(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/dropbox-folder-scan`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folder_url: folderUrl,
            dropbox_account: "new",
            auto_categorize: true,
            skip_existing: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Scan failed");
      }

      const result = await response.json();
      toast.success(`Scanned! Found ${result.new_count} new movies`);
      loadPendingMovies();
    } catch (err) {
      console.error("Error scanning folder:", err);
      toast.error("Failed to scan folder");
    } finally {
      setScanning(false);
    }
  };

  const updateMovie = async (id: string, updates: Partial<PendingMovie>) => {
    try {
      const { error } = await supabase
        .from("pending_movies")
        .update({
          ...updates,
          last_edited_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Movie updated");
      loadPendingMovies();
      setEditingId(null);
    } catch (err) {
      console.error("Error updating movie:", err);
      toast.error("Failed to update movie");
    }
  };

  const toggleFinished = async (id: string, isFinished: boolean) => {
    await updateMovie(id, { is_finished: !isFinished });
  };

  const deleteMovie = async (id: string) => {
    if (!confirm("Delete this movie from preparation?")) return;
    try {
      const { error } = await supabase.from("pending_movies").delete().eq("id", id);
      if (error) throw error;
      toast.success("Movie deleted");
      loadPendingMovies();
    } catch (err) {
      console.error("Error deleting movie:", err);
      toast.error("Failed to delete movie");
    }
  };

  const publishFinished = async () => {
    const finishedMovies = movies.filter((m) => m.is_finished);
    if (finishedMovies.length === 0) {
      toast.error("No finished movies to publish");
      return;
    }

    if (!confirm(`Publish ${finishedMovies.length} finished movies to the site?`)) return;

    setPublishing(true);
    try {
      for (const movie of finishedMovies) {
        // Create the movie in the live library
        const { error: insertError } = await supabase.from("movies").insert({
          title: movie.movie_title,
          description: movie.description,
          year: movie.production_year,
          poster_url: movie.custom_poster_url || movie.poster_url,
          video_url: movie.video_url,
          video_url_720p: movie.video_url_720p,
          video_url_480p: movie.video_url_480p,
          category: movie.custom_category || movie.category,
          vj_name: movie.vj_name,
          is_free: false,
          dropbox_account: "new",
        });

        if (insertError) throw insertError;

        // Delete from pending
        const { error: deleteError } = await supabase
          .from("pending_movies")
          .delete()
          .eq("id", movie.id);

        if (deleteError) throw deleteError;
      }

      toast.success(`Published ${finishedMovies.length} movies to the site!`);
      loadPendingMovies();
      onComplete();
    } catch (err) {
      console.error("Error publishing movies:", err);
      toast.error("Failed to publish movies");
    } finally {
      setPublishing(false);
    }
  };

  const inProgressMovies = movies.filter((m) => !m.is_finished);
  const finishedMovies = movies.filter((m) => m.is_finished);

  const MovieCard = ({ movie, isFinished }: { movie: PendingMovie; isFinished: boolean }) => (
    <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2 hover:bg-muted/50 transition-colors">
      {movie.poster_url || movie.custom_poster_url ? (
        <img
          src={movie.custom_poster_url || movie.poster_url || ""}
          alt={movie.movie_title}
          className="w-full h-32 object-cover rounded"
        />
      ) : (
        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-1">
        <h3 className="font-semibold text-sm line-clamp-2">{movie.movie_title}</h3>
        <p className="text-xs text-muted-foreground">
          {movie.production_year && `Year: ${movie.production_year}`}
        </p>
        {movie.vj_name && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="w-3 h-3" /> VJ: {movie.vj_name}
          </p>
        )}
        {(movie.custom_category || movie.category) && (
          <Badge variant="outline" className="text-xs">
            {movie.custom_category || movie.category}
          </Badge>
        )}
      </div>

      {editingId === movie.id ? (
        <div className="space-y-2 bg-background/50 p-2 rounded border border-border/50">
          <Input
            placeholder="Custom poster URL"
            value={editData.custom_poster_url || ""}
            onChange={(e) =>
              setEditData({ ...editData, custom_poster_url: e.target.value })
            }
            className="text-xs"
          />
          <Input
            placeholder="Category"
            value={editData.custom_category || ""}
            onChange={(e) =>
              setEditData({ ...editData, custom_category: e.target.value })
            }
            className="text-xs"
          />
          <Textarea
            placeholder="Notes"
            value={editData.preparation_notes || ""}
            onChange={(e) =>
              setEditData({ ...editData, preparation_notes: e.target.value })
            }
            className="text-xs h-16"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => updateMovie(movie.id, editData)}
              className="flex-1 bg-primary text-primary-foreground text-xs"
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingId(null)}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {movie.preparation_notes && (
            <p className="text-xs bg-background/50 p-1 rounded border border-border/50 line-clamp-2">
              {movie.preparation_notes}
            </p>
          )}
          <div className="flex gap-1 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(movie.id);
                setEditData(movie);
              }}
              className="flex-1 text-xs"
            >
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => toggleFinished(movie.id, movie.is_finished)}
              className={`flex-1 text-xs ${
                isFinished
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {isFinished ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Mark Done
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMovie(movie.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Advanced AI Watch (New Account)</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Folder Scan Section */}
          <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
            <h3 className="font-semibold">Scan Dropbox Folder</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Paste Dropbox folder URL..."
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                disabled={scanning}
              />
              <Button
                onClick={scanFolder}
                disabled={scanning || !folderUrl.trim()}
                className="bg-primary text-primary-foreground"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {scanning ? "Scanning..." : "Scan"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              New movies only. Already scanned movies will be skipped automatically.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-border rounded p-3 text-center bg-muted/20">
              <p className="text-2xl font-bold">{movies.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="border border-border rounded p-3 text-center bg-muted/20">
              <p className="text-2xl font-bold text-blue-500">{inProgressMovies.length}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="border border-border rounded p-3 text-center bg-muted/20">
              <p className="text-2xl font-bold text-emerald-500">{finishedMovies.length}</p>
              <p className="text-xs text-muted-foreground">Ready</p>
            </div>
          </div>

          {/* Two-Column Layout */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Left: In Progress */}
              <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                  <Clock className="w-4 h-4" />
                  In Progress ({inProgressMovies.length})
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {inProgressMovies.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No movies in progress
                    </p>
                  ) : (
                    inProgressMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} isFinished={false} />
                    ))
                  )}
                </div>
              </div>

              {/* Right: Ready to Publish */}
              <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  Ready to Publish ({finishedMovies.length})
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {finishedMovies.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No finished movies yet
                    </p>
                  ) : (
                    finishedMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} isFinished={true} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Publish Button */}
          {finishedMovies.length > 0 && (
            <Button
              onClick={publishFinished}
              disabled={publishing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Publishing {finishedMovies.length} movies...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish {finishedMovies.length} Finished Movies to Site
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
