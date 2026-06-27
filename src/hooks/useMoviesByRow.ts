import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Movie {
  id: string;
  title: string;
  thumbnail_url: string | null;
  price_ugx: number;
  is_free: boolean;
  row: string;
  series_id: string | null;
  vj: string | null;
  category: string | null;
}

export interface SeriesGroup {
  series_id: string;
  title: string;
  thumbnail_url: string | null;
  price_per_part: number;
  episode_count: number;
  row: string;
}

export function useMoviesByRow() {
  const [moviesByRow, setMoviesByRow] = useState<Record<string, Movie[]>>({});
  const [seriesByRow, setSeriesByRow] = useState<Record<string, SeriesGroup[]>>({});
  const [moviesByCategory, setMoviesByCategory] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from("movies")
      .select("id, title, thumbnail_url, price_ugx, is_free, row, series_id, vj, category")
      .eq("is_coming_soon", false)
      .order("created_at", { ascending: false });

    if (error) {
      // Network/offline failure — stop the spinner so skeletons can render
      setLoading(false);
      return;
    }
    if (data) {
      const grouped: Record<string, Movie[]> = {};
      const seriesMap: Record<string, Record<string, { count: number; price: number; title: string; thumbnail: string | null }>> = {};

      data.forEach((m) => {
        // For series rows, group by series_id
        if ((m.row === "Series" || m.row === "Cinematic Lens Original") && m.series_id) {
          if (!seriesMap[m.row]) seriesMap[m.row] = {};
          if (!seriesMap[m.row][m.series_id]) {
            seriesMap[m.row][m.series_id] = {
              count: 0,
              price: m.price_ugx,
              title: m.title,
              thumbnail: m.thumbnail_url,
            };
          }
          seriesMap[m.row][m.series_id].count++;
        } else {
          if (!grouped[m.row]) grouped[m.row] = [];
          grouped[m.row].push(m);
        }
      });

      // Fetch series metadata for grouped series
      const allSeriesIds = Object.values(seriesMap).flatMap(row => Object.keys(row));
      let seriesMeta: Record<string, { title: string; thumbnail_url: string | null }> = {};
      if (allSeriesIds.length > 0) {
        const { data: seriesData } = await supabase
          .from("series")
          .select("id, title, thumbnail_url")
          .in("id", allSeriesIds);
        if (seriesData) {
          seriesData.forEach(s => {
            seriesMeta[s.id] = { title: s.title, thumbnail_url: s.thumbnail_url };
          });
        }
      }

      const groupedSeries: Record<string, SeriesGroup[]> = {};
      for (const [row, ids] of Object.entries(seriesMap)) {
        groupedSeries[row] = Object.entries(ids).map(([sid, info]) => ({
          series_id: sid,
          title: seriesMeta[sid]?.title || info.title,
          thumbnail_url: seriesMeta[sid]?.thumbnail_url || info.thumbnail,
          price_per_part: info.price,
          episode_count: info.count,
          row,
        }));
      }

      // Group by category (skip series since they have their own rows)
      const byCategory: Record<string, Movie[]> = {};
      data.forEach((m: any) => {
        if (!m.category) return;
        if (m.series_id && (m.row === "Series" || m.row === "Cinematic Lens Original")) return;
        if (!byCategory[m.category]) byCategory[m.category] = [];
        byCategory[m.category].push(m);
      });

      setMoviesByRow(grouped);
      setSeriesByRow(groupedSeries);
      setMoviesByCategory(byCategory);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();

    const channel = supabase
      .channel("movies-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "movies" }, () => {
        fetchMovies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { moviesByRow, seriesByRow, moviesByCategory, loading };
}