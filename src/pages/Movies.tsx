import ContentRow from "@/components/ContentRow";
import { useTitles } from "@/hooks/use-titles";

export default function Movies() {
  const { titles, loading } = useTitles();
  const movies = titles.filter(t => !t.is_vj && t.status === "live");

  if (loading) {
    return <div className="bg-background min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-background min-h-screen pt-20 pb-20">
      <h1 className="text-display text-3xl md:text-5xl px-4 md:px-12 mb-8">Movies</h1>
      {movies.length === 0 ? (
        <p className="px-4 md:px-12 text-muted-foreground">No movies yet.</p>
      ) : (
        <>
          <ContentRow title="All Movies" items={movies} />
          <ContentRow title="Drama" items={movies.filter(m => m.genre === "Drama")} />
          <ContentRow title="Action" items={movies.filter(m => m.genre === "Action")} />
          <ContentRow title="Comedy" items={movies.filter(m => m.genre === "Comedy")} />
          <ContentRow title="Documentary" items={movies.filter(m => m.genre === "Documentary")} />
        </>
      )}
    </div>
  );
}
