import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  bucket: "posters" | "videos";
  value: string;
  onChange: (publicUrl: string, storagePath: string) => void;
  accept?: string;
  label?: string;
  folder?: string;
  maxSizeMB?: number;
}

/**
 * Uploads a file directly to a Lovable Cloud storage bucket and returns
 * the public URL for storing in the titles table.
 */
export default function FileUploader({
  bucket,
  value,
  onChange,
  accept,
  label,
  folder = "uploads",
  maxSizeMB = bucket === "videos" ? 2048 : 10,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isImage = bucket === "posters";
  const Icon = isImage ? ImageIcon : Film;
  const defaultAccept = isImage ? "image/*" : "video/*";

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeName = file.name.replace(/[^a-z0-9.-]+/gi, "_").slice(0, 60);
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      let url = "";
      if (bucket === "posters") {
        url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      } else {
        // Private bucket — generate a long-lived signed URL (1 year)
        const { data: signed, error: sErr } = await supabase.storage
          .from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
        if (sErr) throw sErr;
        url = signed.signedUrl;
      }

      onChange(url, path);
      setProgress(100);
      toast.success(`${isImage ? "Poster" : "Video"} uploaded`);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    onChange("", "");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs text-muted-foreground">{label}</label>}

      {value && isImage && (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-24 h-36 object-cover rounded border border-border bg-secondary" />
          <button
            type="button"
            onClick={clear}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {value && !isImage && (
        <div className="flex items-center gap-2 text-xs text-foreground bg-secondary rounded px-2 py-1.5">
          <Film className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate flex-1">Video uploaded ✓</span>
          <button type="button" onClick={clear} className="text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept || defaultAccept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="gap-2"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="w-4 h-4" /> {value ? `Replace ${isImage ? "poster" : "video"}` : `Upload ${isImage ? "poster" : "video"}`}</>
        )}
      </Button>
      {!isImage && (
        <p className="text-[10px] text-muted-foreground">
          Stored privately in cloud. Max {maxSizeMB}MB per file.
        </p>
      )}
    </div>
  );
}
