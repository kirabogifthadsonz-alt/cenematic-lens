import ContentRow from "@/components/ContentRow";
import { titles } from "@/lib/content-data";

export default function Movies() {
  const movies = titles.filter(t => !t.isVJ);
  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">Movies</h1>
      <ContentRow title="All Movies" items={movies} />
      <ContentRow title="Drama" items={movies.filter(m => m.genre === "Drama")} />
      <ContentRow title="Action" items={movies.filter(m => m.genre === "Action")} />
      <ContentRow title="Comedy" items={movies.filter(m => m.genre === "Comedy")} />
      <ContentRow title="Documentary" items={movies.filter(m => m.genre === "Documentary")} />
    </div>
  );
}
