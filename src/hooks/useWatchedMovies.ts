import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WatchedMovie {
  id: string;
  title: string;
  thumbnail_url: string | null;
  price_ugx: number;
  is_free: boolean;
}

export function useWatchedMovies() {
  const [movies, setMovies] = useState<WatchedMovie[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get purchases from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: purchases } = await supabase
        .from("purchases")
        .select("movie_id, created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (!purchases || purchases.length === 0) return;

      // Also check watch_progress for completed movies (>= 95%)
      const { data: progress } = await supabase
        .from("watch_progress")
        .select("movie_id, current_time_seconds, duration_seconds")
        .eq("user_id", user.id);

      // Get movies that are either purchased or fully watched
      const purchasedIds = [...new Set(purchases.map(p => p.movie_id))];

      if (purchasedIds.length === 0) return;

      const { data: movieData } = await supabase
        .from("movies")
        .select("id, title, thumbnail_url, price_ugx, is_free")
        .in("id", purchasedIds);

      if (!movieData) return;

      setMovies(movieData);
    };

    fetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetch();
    });

    return () => subscription.unsubscribe();
  }, []);

  return movies;
}
