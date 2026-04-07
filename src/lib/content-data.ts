// This file now only exports the TypeScript interface.
// All data comes from Supabase. No hardcoded movies.

export interface Title {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnail_url: string;
  video_url: string;
  genre: string;
  language: string;
  year: number;
  duration: string;
  rating: string;
  is_free: boolean;
  is_vj: boolean;
  category: string[];
  cast_members?: string[] | null;
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
}
