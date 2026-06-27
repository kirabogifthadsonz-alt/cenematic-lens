import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrendingMovie {
  id: string;
  title: string;
  thumbnail_url: string | null;
  price_ugx: number;
  is_free: boolean;
  row: string;
}

export function useTrendingMovies() {
  const [movies, setMovies] = useState<TrendingMovie[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Get views from the last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentViews } = await supabase
        .from("views")
        .select("movie_id")
        .gte("viewed_at", twentyFourHoursAgo.toISOString());

      if (!recentViews || recentViews.length === 0) {
        setMovies([]);
        return;
      }

      // Count views per movie
      const viewCounts: Record<string, number> = {};
      recentViews.forEach((v) => {
        viewCounts[v.movie_id] = (viewCounts[v.movie_id] || 0) + 1;
      });

      // Sort by view count descending, take top 20
      const sortedIds = Object.entries(viewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id);

      if (sortedIds.length === 0) {
        setMovies([]);
        return;
      }

      // Fetch movie details
      const { data: movieData } = await supabase
        .from("movies")
        .select("id, title, thumbnail_url, price_ugx, is_free, row")
        .in("id", sortedIds)
        .eq("is_coming_soon", false);

      if (!movieData) {
        setMovies([]);
        return;
      }

      // Sort by view count
      const movieMap = new Map(movieData.map((m) => [m.id, m]));
      const sorted: TrendingMovie[] = [];
      for (const id of sortedIds) {
        const m = movieMap.get(id);
        if (m) sorted.push(m);
      }

      setMovies(sorted);
    };

    fetch();

    // Refresh every 5 minutes
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return movies;
}
