import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";

export default function NewPopular() {
  const { getTrending, getByRow, loading } = useTitles();

  if (loading) {
    return <div className="bg-background min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">New & Popular</h1>
      <ContentRow title="New on Cinematic Lens" items={getByRow("New Release")} />
      <ContentRow title="Trending" items={getTrending()} />
    </div>
  );
}
