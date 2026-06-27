import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Clock, Loader2, Check } from "lucide-react";
import { usePackages, useSubscription, formatCountdown, type SubscriptionPackage } from "@/hooks/useSubscription";
import PesapalCheckout from "@/components/PesapalCheckout";
import { supabase } from "@/integrations/supabase/client";

interface SubscribeDialogProps {
  open: boolean;
  onClose: () => void;
  onActivated?: () => void | Promise<void>;
  title?: string;
  subtitle?: string;
}

export default function SubscribeDialog({ open, onClose, onActivated, title = "Subscribe to watch", subtitle = "Pick a package — all movies, one price." }: SubscribeDialogProps) {
  const navigate = useNavigate();
  const { packages, loading } = usePackages();
  const { activeSub, isActive, countdown, refresh } = useSubscription();
  const [selected, setSelected] = useState<SubscriptionPackage | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  if (!open) return null;

  const handlePick = async (pkg: SubscriptionPackage) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    setSelected(pkg);
    setShowCheckout(true);
  };

  const onSuccess = async () => {
    setShowCheckout(false);
    setSelected(null);
    // Refresh subscription state after successful payment
    await refresh();
    // Call the callback (e.g., navigate or update parent state)
    if (onActivated) {
      // Small delay to ensure subscription state is updated
      setTimeout(() => onActivated(), 100);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
        <div
          className="w-full md:max-w-md bg-card border border-border rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-display">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>

          {isActive && (
            <div className="mb-4 rounded-lg p-3 border border-primary/30 bg-primary/10 flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Active — </span>
                <span className="text-muted-foreground">{countdown} left</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2">
              {packages.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePick(p)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 transition-all active:scale-[0.98] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.label}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDuration(p.duration_hours)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{p.price_ugx.toLocaleString()} <span className="text-[10px] text-muted-foreground">UGX</span></p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Pay securely via Pesapal. Subscription unlocks every movie until it expires.
          </p>
        </div>
      </div>

      {showCheckout && selected && (
        <PesapalCheckout
          amount={selected.price_ugx}
          packageKey={selected.key}
          description={`${selected.label} subscription`}
          onClose={() => { setShowCheckout(false); setSelected(null); }}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = hours / 24;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 30) return `${Math.round(days / 7)} week${days === 7 ? "" : "s"}`;
  if (days < 60) return `${Math.round(days / 30)} month`;
  return `${Math.round(days / 30)} months`;
}
