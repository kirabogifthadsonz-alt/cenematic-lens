import ContentRow from "@/components/ContentRow";
import { getVJ } from "@/lib/content-data";

export default function VJs() {
  const vjContent = getVJ();
  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">VJs</h1>
      <ContentRow title="All VJ Content" items={vjContent} />
      <ContentRow title="VJ Mixes" items={vjContent.filter(v => v.genre === "VJ Mix")} />
      <ContentRow title="VJ Sessions" items={vjContent.filter(v => v.genre === "VJ Session")} />
      <ContentRow title="Music Videos" items={vjContent.filter(v => v.genre === "Music")} />
    </div>
  );
}
