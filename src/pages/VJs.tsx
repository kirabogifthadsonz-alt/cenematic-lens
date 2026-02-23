import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";
import { Loader2 } from "lucide-react";

export default function VJs() {
  const { loading, getVJ } = useTitles();
  const vjContent = getVJ();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

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
