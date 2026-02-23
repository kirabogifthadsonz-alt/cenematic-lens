// This file now only exports the TypeScript interface.
// All data comes from Supabase via hooks.

export interface Title {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnail_url: string;
  videoUrl: string;
  video_url: string;
  genre: string;
  language: string;
  year: number;
  duration: string;
  rating: string;
  isFree: boolean;
  is_free: boolean;
  isVJ: boolean;
  is_vj: boolean;
  category: string[];
  cast?: string[];
  cast_members?: string[];
  row: string;
  vj_narrator: string;
  is_series: boolean;
  series_id: string | null;
  season: number;
  episode: number;
  views: number;
  is_coming_soon: boolean;
  status: string;
  price: number;
  created_at: string;
  updated_at: string;
}

// Map DB row to unified Title interface
export function mapDbTitle(t: any): Title {
  return {
    ...t,
    thumbnail: t.thumbnail_url || t.thumbnail || "",
    thumbnail_url: t.thumbnail_url || t.thumbnail || "",
    videoUrl: t.video_url || "",
    isFree: t.is_free || false,
    isVJ: t.is_vj || false,
  };
}
