import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function MyList() {
  const { titles, loading } = useTitles();
  const { myList } = useStore();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const items = titles.filter(t => myList.includes(t.id));

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">My List</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12 px-4">You haven't added anything to your list yet.</p>
      ) : (
        <ContentRow title="" items={items} />
      )}
    </div>
  );
}
