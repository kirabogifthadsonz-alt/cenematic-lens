import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type DbTitle = Tables<"titles">;

export function useTitles() {
  const [titles, setTitles] = useState<DbTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("titles")
        .select("*")
        .order("created_at", { ascending: false });
      setTitles(data || []);
      setLoading(false);
    };
    fetch();

    // Realtime
    const channel = supabase
      .channel("titles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "titles" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTitles(prev => [payload.new as DbTitle, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setTitles(prev => prev.map(t => t.id === (payload.new as DbTitle).id ? payload.new as DbTitle : t));
        } else if (payload.eventType === "DELETE") {
          setTitles(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getByRow = (row: string) => titles.filter(t => t.row === row && t.status === "live" && !t.is_coming_soon);
  const getByCategory = (cat: string) => titles.filter(t => t.category.includes(cat) && t.status === "live");
  const getTrending = () => [...titles].filter(t => t.status === "live").sort((a, b) => b.views - a.views).slice(0, 10);
  const getVJ = () => titles.filter(t => t.is_vj && t.status === "live");
  const getFree = () => titles.filter(t => t.is_free && t.status === "live");
  const getComingSoon = () => titles.filter(t => t.is_coming_soon);
  const getById = (id: string) => titles.find(t => t.id === id);

  return { titles, loading, getByRow, getByCategory, getTrending, getVJ, getFree, getComingSoon, getById };
}
