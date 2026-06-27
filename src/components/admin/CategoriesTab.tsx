import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";

export default function CategoriesTab({ onUpdate }: { onUpdate: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("display_order");
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newName.trim()) { toast.error("Enter a category name"); return; }
    setLoading(true);
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c: any) => c.display_order)) : 0;
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), display_order: maxOrder + 1 } as any);
    if (error) toast.error(error.message);
    else { toast.success("Category added!"); setNewName(""); fetchCategories(); onUpdate(); }
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Category removed"); fetchCategories(); onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-display">Movie Categories</h2>
          <p className="text-sm text-muted-foreground">Manage categories. Changes reflect in all upload forms and filters.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="New category name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-secondary max-w-xs" />
        <Button onClick={addCategory} disabled={loading} className="gap-1"><Plus className="w-4 h-4" /> Add</Button>
      </div>
      <div className="space-y-1">
        {categories.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">Order: {c.display_order}</span>
            </div>
            <button onClick={() => deleteCategory(c.id)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {categories.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No categories yet.</p>}
      </div>
    </div>
  );
}
