import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContinueWatchingMovie {
  id: string;
  title: string;
  thumbnail_url: string | null;
  price_ugx: number;
  is_free: boolean;
  progress: number; // 0-100
}

export function useContinueWatching() {
  const [movies, setMovies] = useState<ContinueWatchingMovie[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progress } = await supabase
        .from("watch_progress")
        .select("movie_id, current_time_seconds, duration_seconds")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!progress || progress.length === 0) return;

      // Filter: started but not finished (between 5% and 95%)
      const validProgress = progress.filter((p) => {
        if (p.duration_seconds <= 0) return false;
        const pct = (p.current_time_seconds / p.duration_seconds) * 100;
        return pct > 5 && pct < 95;
      });

      if (validProgress.length === 0) return;

      const movieIds = validProgress.map((p) => p.movie_id);
      const { data: movieData } = await supabase
        .from("movies")
        .select("id, title, thumbnail_url, price_ugx, is_free")
        .in("id", movieIds);

      if (!movieData) return;

      const movieMap = new Map(movieData.map((m) => [m.id, m]));
      const result: ContinueWatchingMovie[] = [];

      for (const p of validProgress) {
        const movie = movieMap.get(p.movie_id);
        if (!movie) continue;
        result.push({
          ...movie,
          progress: Math.round((p.current_time_seconds / p.duration_seconds) * 100),
        });
      }

      setMovies(result);
    };

    fetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetch();
    });

    return () => subscription.unsubscribe();
  }, []);

  return movies;
}
