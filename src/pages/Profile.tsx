import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, User, Camera, Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import MarqueeBar from "@/components/MarqueeBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function compressImage(file: File, maxSize = 500, maxBytes = 1024 * 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            if (blob.size > maxBytes && quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(blob);
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const { wallet, freeCredits } = useStore();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showPickerDialog, setShowPickerDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setProfile(data);
        setUsername(data.username || "");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      toast.error("Only JPG and PNG images are allowed");
      return;
    }
    try {
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
      setPreviewBlob(compressed);
      setShowPreview(true);
    } catch {
      toast.error("Failed to process image");
    }
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!previewBlob || !profile) return;
    setUploading(true);
    try {
      const fileName = `${profile.user_id}/${profile.user_id}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, previewBlob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: publicUrl })
        .eq("user_id", profile.user_id);
      if (updateError) throw updateError;

      setProfile((p: any) => ({ ...p, phone: publicUrl }));
      setShowPreview(false);
      setPreviewUrl(null);
      setPreviewBlob(null);
      toast.success("Profile photo updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ username }).eq("user_id", profile.user_id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MarqueeBar />
        <div className="pt-24 px-4 md:px-12 max-w-xl mx-auto">
          <h1 className="text-3xl font-display mb-8">Profile</h1>
          <div className="bg-card rounded-xl p-6 border border-border animate-pulse h-64" />
        </div>
        <Footer />
      </div>
    );
  }

  const avatarUrl = profile?.phone;

  return (
    <div className="min-h-screen bg-background">
      <MarqueeBar />
      <div className="pt-24 px-4 md:px-12 max-w-xl mx-auto pb-20">
        <h1 className="text-3xl font-display mb-8">Profile</h1>
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer group" onClick={() => setShowPickerDialog(true)}>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center ring-2 ring-primary/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              {/* Camera overlay */}
              <div className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-background group-hover:scale-110 transition-transform">
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
              </div>
            </div>
            <div>
              <p className="font-semibold">{profile?.username || "User"}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-primary">UGX {wallet.toLocaleString()}</span>
                {freeCredits > 0 && <span className="text-primary">• {freeCredits} free credit(s)</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tap photo to change</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Save Changes</Button>
            <Button variant="secondary" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Picker Dialog */}
      <Dialog open={showPickerDialog} onOpenChange={setShowPickerDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Change Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { setShowPickerDialog(false); fileInputRef.current?.click(); }}
            >
              <span className="text-lg">🖼️</span> Choose from Gallery
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { setShowPickerDialog(false); cameraInputRef.current?.click(); }}
            >
              <Camera className="w-5 h-5" /> Take Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => { if (!uploading) { setShowPreview(open); if (!open) { setPreviewUrl(null); setPreviewBlob(null); } } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Preview Photo</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-full overflow-hidden ring-2 ring-primary/30">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={uploading}
                  onClick={() => { setShowPreview(false); setPreviewUrl(null); setPreviewBlob(null); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={uploading}
                  onClick={handleUpload}
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Upload"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
