import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTitle, Title } from "@/lib/content-data";

export function useTitles() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("titles")
        .select("*")
        .order("created_at", { ascending: false });
      setTitles((data || []).map(mapDbTitle));
      setLoading(false);
    };
    fetch();

    // Realtime
    const channel = supabase
      .channel("titles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "titles" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTitles(prev => [mapDbTitle(payload.new), ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setTitles(prev => prev.map(t => t.id === (payload.new as any).id ? mapDbTitle(payload.new) : t));
        } else if (payload.eventType === "DELETE") {
          setTitles(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getByRow = (row: string) => titles.filter(t => t.row === row && t.status === "live" && !t.series_id);
  const getByCategory = (cat: string) => titles.filter(t => t.category.includes(cat) && t.status === "live" && !t.series_id);
  const getTrending = () => [...titles].filter(t => t.status === "live" && !t.series_id).sort((a, b) => b.views - a.views).slice(0, 10);
  const getVJ = () => titles.filter(t => t.is_vj && t.status === "live" && !t.series_id);
  const getFree = () => titles.filter(t => t.is_free && t.status === "live" && !t.series_id);
  const getById = (id: string) => titles.find(t => t.id === id);
  const getSeriesParts = (seriesId: string) => titles.filter(t => t.series_id === seriesId).sort((a, b) => a.season - b.season || a.episode - b.episode);
  const getSeriesMain = () => titles.filter(t => t.is_series && !t.series_id && t.status === "live");

  return { titles, loading, getByRow, getByCategory, getTrending, getVJ, getFree, getById, getSeriesParts, getSeriesMain };
}
