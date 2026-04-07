import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";
import { useStore } from "@/lib/store";

export default function MyList() {
  const { myList } = useStore();
  const { titles, loading } = useTitles();
  const items = titles.filter(t => myList.includes(t.id));

  if (loading) {
    return <div className="bg-background min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">My List</h1>
      {items.length === 0 ? (
        <p className="px-4 md:px-12 text-muted-foreground">Your list is empty. Browse and add titles!</p>
      ) : (
        <ContentRow title="" items={items} />
      )}
    </div>
  );
}
