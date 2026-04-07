import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";

export default function VJs() {
  const { getVJ, loading } = useTitles();
  const vjContent = getVJ();

  if (loading) {
    return <div className="bg-background min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">VJs</h1>
      {vjContent.length === 0 ? (
        <p className="px-4 md:px-12 text-muted-foreground">No VJ content yet.</p>
      ) : (
        <>
          <ContentRow title="All VJ Content" items={vjContent} />
          <ContentRow title="VJ Mixes" items={vjContent.filter(v => v.genre === "VJ Mix")} />
          <ContentRow title="VJ Sessions" items={vjContent.filter(v => v.genre === "VJ Session")} />
          <ContentRow title="Music Videos" items={vjContent.filter(v => v.genre === "Music")} />
        </>
      )}
    </div>
  );
}
