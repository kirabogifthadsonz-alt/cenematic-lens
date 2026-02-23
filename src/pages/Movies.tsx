import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";
import { Loader2 } from "lucide-react";

export default function Movies() {
  const { titles, loading, getByCategory } = useTitles();
  const movies = titles.filter(t => !t.is_vj && t.status === "live" && !t.series_id);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">Movies</h1>
      <ContentRow title="All Movies" items={movies} />
      <ContentRow title="Luganda" items={getByCategory("luganda").filter(t => !t.is_vj)} />
      <ContentRow title="Nollywood" items={getByCategory("nollywood")} />
      <ContentRow title="Action & Thriller" items={movies.filter(m => m.genre === "Action")} />
      <ContentRow title="Drama" items={movies.filter(m => m.genre === "Drama")} />
      <ContentRow title="Comedy" items={movies.filter(m => m.genre === "Comedy")} />
    </div>
  );
}
