import ContentRow from "@/components/ContentRow";
import { getByCategory } from "@/lib/content-data";

export default function NewPopular() {
  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">New & Popular</h1>
      <ContentRow title="New on Cinematic Lens" items={getByCategory("new")} />
      <ContentRow title="Trending" items={getByCategory("trending")} />
    </div>
  );
}
