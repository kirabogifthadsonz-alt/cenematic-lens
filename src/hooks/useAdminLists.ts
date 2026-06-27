import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VJItem {
  id: string;
  name: string;
  display_order: number;
}

export interface ContentRowItem {
  id: string;
  name: string;
  display_order: number;
  default_price: number;
  is_series_row: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  display_order: number;
}

export function useVJList() {
  const [vjs, setVJs] = useState<VJItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("vj_list")
      .select("*")
      .order("display_order");
    setVJs((data as VJItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return { vjs, vjNames: vjs.map(v => v.name), loading, refetch: fetch };
}

export function useContentRows() {
  const [rows, setRows] = useState<ContentRowItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("content_rows")
      .select("*")
      .order("display_order");
    setRows((data as ContentRowItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return { rows, rowNames: rows.map(r => r.name), loading, refetch: fetch };
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
    setCategories((data as CategoryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return { categories, categoryNames: categories.map(c => c.name), loading, refetch: fetch };
}
