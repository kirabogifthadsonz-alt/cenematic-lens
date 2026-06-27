import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  duration_label: string;
  duration_minutes: number;
  price: number;
  currency: string;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<Plan, "id"> = {
  name: "",
  duration_label: "",
  duration_minutes: 60,
  price: 0,
  currency: "UGX",
  description: "",
  features: [],
  is_active: true,
  sort_order: 0,
};

export default function SubscriptionPlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Plan, "id">>(empty);
  const [featuresText, setFeaturesText] = useState("");

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Failed to load plans", description: error.message, variant: "destructive" });
    setPlans((data as Plan[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...empty, sort_order: plans.length + 1 });
    setFeaturesText("");
    setOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditingId(p.id);
    setForm({
      name: p.name, duration_label: p.duration_label, duration_minutes: p.duration_minutes,
      price: Number(p.price), currency: p.currency, description: p.description,
      features: p.features || [], is_active: p.is_active, sort_order: p.sort_order,
    });
    setFeaturesText((p.features || []).join("\n"));
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.duration_label.trim()) {
      toast({ title: "Name and duration label are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      features: featuresText.split("\n").map(s => s.trim()).filter(Boolean),
    };
    const { error } = editingId
      ? await (supabase as any).from("subscription_plans").update(payload).eq("id", editingId)
      : await (supabase as any).from("subscription_plans").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Plan updated" : "Plan created" });
    setOpen(false);
    fetchPlans();
  };

  const toggleActive = async (p: Plan) => {
    const { error } = await (supabase as any)
      .from("subscription_plans")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    fetchPlans();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await (supabase as any).from("subscription_plans").delete().eq("id", deleteId);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else toast({ title: "Plan deleted" });
    setDeleteId(null);
    fetchPlans();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground text-sm">Manage pricing tiers users can subscribe to.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Plan</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Plans ({plans.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No plans yet. Create your first tier.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.sort_order}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.duration_label} <span className="text-muted-foreground text-xs">({p.duration_minutes}m)</span></TableCell>
                    <TableCell>{p.currency} {Number(p.price).toLocaleString()}</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Plan" : "New Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Day Pass" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Duration label</label>
                <Input value={form.duration_label} onChange={e => setForm({ ...form, duration_label: e.target.value })} placeholder="1 Day" />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Price</label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Features (one per line)</label>
              <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={3} placeholder="Unlimited streaming&#10;HD quality" />
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-sm font-medium">Sort order</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <span className="text-sm">Active</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
