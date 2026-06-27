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
      // Use the 'views' field in 'titles' table for trending
      const { data: movieData, error } = await supabase
        .from("titles")
        .select("id, title, thumbnail_url, price, is_free, row, views")
        .eq("status", "live")
        .eq("is_coming_soon", false)
        .order("views", { ascending: false })
        .limit(20);

      if (error || !movieData) {
        console.error("Error fetching trending titles:", error);
        setMovies([]);
        return;
      }

      const mapped: TrendingMovie[] = movieData.map(m => ({
        id: m.id,
        title: m.title,
        thumbnail_url: m.thumbnail_url,
        price_ugx: m.price,
        is_free: m.is_free,
        row: m.row || "Other"
      }));

      setMovies(mapped);
    };

    fetch();

    // Refresh every 5 minutes
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return movies;
}
