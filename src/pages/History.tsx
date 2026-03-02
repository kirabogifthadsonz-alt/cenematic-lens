import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTitles } from "@/hooks/use-titles";
import { useAuth } from "@/hooks/use-auth";
import ContentRow from "@/components/ContentRow";
import { Loader2, Clock } from "lucide-react";

export default function History() {
  const { user } = useAuth();
  const { titles, loading: titlesLoading } = useTitles();
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("transactions")
      .select("title_id")
      .eq("user_id", user.id)
      .in("type", ["watch", "credit_used"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const ids = (data || []).map(t => t.title_id).filter(Boolean) as string[];
        setWatchedIds([...new Set(ids)]);
        setLoading(false);
      });
  }, [user]);

  if (loading || titlesLoading) return <div className="min-h-screen bg-background flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const items = watchedIds.map(id => titles.find(t => t.id === id)).filter(Boolean);

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <div className="flex items-center gap-3 px-4 md:px-12 mb-8">
        <Clock className="w-7 h-7 text-primary" />
        <h1 className="text-foreground text-3xl md:text-5xl font-bold">Watch History</h1>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12 px-4">You haven't watched anything yet.</p>
      ) : (
        <ContentRow title="" items={items as any} />
      )}
    </div>
  );
}
