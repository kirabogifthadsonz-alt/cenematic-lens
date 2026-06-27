import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Loader2, Film, Play, Trash2, Power } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const INTRO_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/videos/logo-intro.mp4`;

export default function LogoIntroTab() {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(INTRO_URL);
  const [previewKey, setPreviewKey] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch current setting
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("logo_intro_settings")
        .select("is_enabled")
        .eq("id", 1)
        .maybeSingle();
      if (data) setIsEnabled(data.is_enabled);
    };
    fetch();
  }, []);

  const toggleEnabled = async (enabled: boolean) => {
    setIsEnabled(enabled);
    const { error } = await supabase
      .from("logo_intro_settings")
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      toast.error("Failed to update setting");
      setIsEnabled(!enabled);
    } else {
      toast.success(enabled ? "Logo animation enabled" : "Logo animation disabled");
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a video file"); return; }
    if (!file.type.startsWith("video/")) { toast.error("Please select a video file"); return; }

    setUploading(true);
    try {
      const { error } = await supabase.storage.from("videos").upload("logo-intro.mp4", file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;

      toast.success("Logo animation updated!");
      setPreviewUrl(`${INTRO_URL}?t=${Date.now()}`);
      setPreviewKey(k => k + 1);
      if (fileRef.current) fileRef.current.value = "";
      // Auto-enable when uploading new
      if (!isEnabled) toggleEnabled(true);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      const { error } = await supabase.storage.from("videos").remove(["logo-intro.mp4"]);
      if (error) throw error;
      toast.success("Logo animation deleted");
      setPreviewUrl("");
      // Disable when deleted
      await supabase
        .from("logo_intro_settings")
        .update({ is_enabled: false, updated_at: new Date().toISOString() })
        .eq("id", 1);
      setIsEnabled(false);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Film className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-lg font-display">Logo Intro Animation</h2>
          <p className="text-sm text-muted-foreground">This animation plays before every movie. The main movie preloads in the background while it plays.</p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Power className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">Logo Animation</p>
            <p className="text-xs text-muted-foreground">{isEnabled ? "Plays before every movie" : "Disabled — movies play directly"}</p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={toggleEnabled} />
      </div>

      {/* Current Preview */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <Play className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Current Logo Animation</span>
        </div>
        <div className="bg-black aspect-video flex items-center justify-center">
          {previewUrl ? (
            <video
              key={previewKey}
              src={previewUrl}
              className="w-full h-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No animation uploaded</p>
          )}
        </div>
      </div>

      {/* Upload New */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <Label className="text-sm font-semibold">Upload New Animation</Label>
        <p className="text-xs text-muted-foreground">Upload an MP4 video. Keep it short (5-15 seconds) for best experience. This will replace the current animation.</p>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/*"
          className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
        />
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Replace Logo Animation"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting || !previewUrl}
            className="gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Logo Animation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the logo animation. Movies will start playing directly without an intro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
