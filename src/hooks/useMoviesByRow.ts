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
  category: string[] | null;
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
    // Mapping from 'titles' table which exists in DB
    const { data, error } = await supabase
      .from("titles")
      .select("id, title, thumbnail_url, price, is_free, row, series_id, vj_narrator, category, is_coming_soon")
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching titles:", error);
      setLoading(false);
      return;
    }
    if (data) {
      const grouped: Record<string, Movie[]> = {};
      const seriesMap: Record<string, Record<string, { count: number; price: number; title: string; thumbnail: string | null }>> = {};
      const byCategory: Record<string, Movie[]> = {};

      data.forEach((item) => {
        const m: Movie = {
          id: item.id,
          title: item.title,
          thumbnail_url: item.thumbnail_url,
          price_ugx: item.price,
          is_free: item.is_free,
          row: item.row || "Other",
          series_id: item.series_id,
          vj: item.vj_narrator,
          category: item.category,
        };

        if (item.is_coming_soon) {
            if (!grouped["Coming Soon"]) grouped["Coming Soon"] = [];
            grouped["Coming Soon"].push(m);
            return;
        }

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

        // Group by category
        if (m.category && Array.isArray(m.category)) {
          m.category.forEach(cat => {
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(m);
          });
        }
      });

      const groupedSeries: Record<string, SeriesGroup[]> = {};
      for (const [row, ids] of Object.entries(seriesMap)) {
        groupedSeries[row] = Object.entries(ids).map(([sid, info]) => ({
          series_id: sid,
          title: info.title, // Simplified: use first episode title if series meta not available
          thumbnail_url: info.thumbnail,
          price_per_part: info.price,
          episode_count: info.count,
          row,
        }));
      }

      setMoviesByRow(grouped);
      setSeriesByRow(groupedSeries);
      setMoviesByCategory(byCategory);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();

    const channel = supabase
      .channel("titles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "titles" }, () => {
        fetchMovies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { moviesByRow, seriesByRow, moviesByCategory, loading };
}
