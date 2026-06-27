import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Gift, Loader2 } from "lucide-react";

export default function WalletPromoTab() {
  const [promo, setPromo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minAmount, setMinAmount] = useState("5000");
  const [multiplier, setMultiplier] = useState("2");
  const [message, setMessage] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const fetchPromo = async () => {
    const { data } = await supabase.from("wallet_promotions").select("*").limit(1).maybeSingle();
    if (data) {
      setPromo(data);
      setMinAmount(String(data.min_amount));
      setMultiplier(String(data.multiplier));
      setMessage(data.message);
      setIsActive(data.is_active);
      setExpiresAt(data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : "");
    }
    setLoading(false);
  };

  useEffect(() => { fetchPromo(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      min_amount: parseInt(minAmount) || 5000,
      multiplier: parseInt(multiplier) || 2,
      message: message.trim(),
      is_active: isActive,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    if (promo) {
      const { error } = await supabase.from("wallet_promotions").update(payload).eq("id", promo.id);
      if (error) toast.error(error.message);
      else { toast.success("Promotion updated!"); fetchPromo(); }
    } else {
      const { error } = await supabase.from("wallet_promotions").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Promotion created!"); fetchPromo(); }
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Gift className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-display">Deposit Promotion</h2>
          <p className="text-sm text-muted-foreground">Multiply user deposits to encourage larger deposits.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Promotion Active</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div>
          <Label className="text-xs">Minimum Amount (UGX)</Label>
          <Input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="bg-secondary" />
          <p className="text-xs text-muted-foreground mt-1">Deposits at or above this amount get multiplied.</p>
        </div>

        <div>
          <Label className="text-xs">Multiplier</Label>
          <Input type="number" value={multiplier} onChange={e => setMultiplier(e.target.value)} min="2" max="10" className="bg-secondary" />
          <p className="text-xs text-muted-foreground mt-1">E.g. 2 = double the deposit amount.</p>
        </div>

        <div>
          <Label className="text-xs">Promotion Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} className="bg-secondary" rows={3} />
        </div>

        <div>
          <Label className="text-xs">Expires At (optional)</Label>
          <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="bg-secondary" />
          <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry (manual toggle only).</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Promotion Settings"}
        </Button>
      </div>

      {/* Preview */}
      {isActive && (
        <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))" }}>
          <div className="p-4 text-center text-white">
            <p className="text-lg font-bold">🔥 LIMITED TIME OFFER! 🔥</p>
            <p className="text-sm mt-1">{message}</p>
            <p className="text-xs mt-2 opacity-80">
              Min: {parseInt(minAmount).toLocaleString()} UGX • {multiplier}X multiplier
              {expiresAt && ` • Ends: ${new Date(expiresAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
