import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Check, X, Clock } from "lucide-react";

interface Pkg {
  id: string;
  key: string;
  label: string;
  duration_hours: number;
  price_ugx: number;
  display_order: number;
  is_active: boolean;
}

export default function PricingTab() {
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const fetchPkgs = async () => {
    const { data } = await supabase
      .from("subscription_packages")
      .select("*")
      .order("display_order");
    setPkgs((data as Pkg[]) || []);
  };

  useEffect(() => { fetchPkgs(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("pkg-pricing-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscription_packages" }, () => fetchPkgs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const startEdit = (p: Pkg) => {
    setEditingId(p.id);
    setEditPrice(String(p.price_ugx));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const savePrice = async (id: string) => {
    const price = parseInt(editPrice);
    if (isNaN(price) || price < 0) { toast.error("Enter a valid price"); return; }
    const { error } = await supabase
      .from("subscription_packages")
      .update({ price_ugx: price })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Price updated!");
    setEditingId(null);
    fetchPkgs();
  };

  const formatDuration = (h: number) => {
    if (h < 24) return `${h} hour${h === 1 ? "" : "s"}`;
    const d = h / 24;
    if (d < 7) return `${d} day${d === 1 ? "" : "s"}`;
    if (d < 30) return `${Math.round(d / 7)} week${d === 7 ? "" : "s"}`;
    if (d < 60) return "1 month";
    return "2 months";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-display">Subscription Pricing</h2>
          <p className="text-sm text-muted-foreground">Edit subscription package prices. Changes apply instantly to new subscribers.</p>
        </div>
      </div>

      <div className="space-y-2">
        {pkgs.map(p => (
          <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{p.label}</p>
                <p className="text-[11px] text-muted-foreground">{formatDuration(p.duration_hours)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingId === p.id ? (
                <>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="bg-secondary w-28 h-8 text-sm"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">UGX</span>
                  <button onClick={() => savePrice(p.id)} className="text-green-400 hover:text-green-300">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold text-primary tabular-nums">{p.price_ugx.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">UGX</span></span>
                  <button onClick={() => startEdit(p)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {pkgs.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No packages yet.</p>}
      </div>
    </div>
  );
}
