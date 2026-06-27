import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Film, Sparkles, Shield, ArrowRight } from "lucide-react";

interface FeatureMeta { id: string; label: string; }

interface Props {
  userId: string;
  displayName: string | null | undefined;
  enabledFeatures: string[];
  allFeatures: FeatureMeta[];
  onGoToContent: () => void;
}

export default function SubAdminOnboarding({
  userId,
  displayName,
  enabledFeatures,
  allFeatures,
  onGoToContent,
}: Props) {
  const storageKey = `subadmin_onboarded_${userId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) setOpen(true);
  }, [userId, storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  const grantedLabels = allFeatures
    .filter(f => enabledFeatures.includes(f.id))
    .map(f => f.label);

  const hasContent = enabledFeatures.includes("content");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-lg bg-card border-primary/30">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wide uppercase">Welcome aboard</span>
          </div>
          <DialogTitle className="text-2xl font-display">
            Hi {displayName?.split(" ")[0] || "there"}, you're in 🎬
          </DialogTitle>
          <DialogDescription>
            You've been granted sub-admin access to Cinematic Lens. Here's what you can manage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Your permissions ({grantedLabels.length})</h3>
            </div>
            {grantedLabels.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No features have been granted yet. Please contact the master admin.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                {grantedLabels.map(label => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasContent && (
            <button
              onClick={() => { onGoToContent(); dismiss(); }}
              className="group w-full text-left rounded-lg border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Jump into Content Library</p>
                  <p className="text-xs text-muted-foreground">Add, edit and organize movies & series</p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={dismiss}>
              Get started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
