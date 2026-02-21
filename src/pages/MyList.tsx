import ContentRow from "@/components/ContentRow";
import { titles } from "@/lib/content-data";
import { useStore } from "@/lib/store";

export default function MyList() {
  const { myList } = useStore();
  const items = titles.filter(t => myList.includes(t.id));

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
