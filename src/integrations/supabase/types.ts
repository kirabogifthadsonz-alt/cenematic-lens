export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_dashboard_settings: {
        Row: {
          displayed_income: number | null
          id: number
          updated_at: string
        }
        Insert: {
          displayed_income?: number | null
          id: number
          updated_at?: string
        }
        Update: {
          displayed_income?: number | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      background_music: {
        Row: {
          artist: string | null
          created_at: string
          file_url: string
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          artist?: string | null
          created_at?: string
          file_url: string
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          artist?: string | null
          created_at?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          content: string
          cover_image: string
          created_at: string
          excerpt: string
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          content?: string
          cover_image?: string
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          cover_image?: string
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      content_rows: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      dropbox_folders: {
        Row: {
          created_at: string
          enabled: boolean
          folder_name: string
          folder_path: string
          id: string
          last_cursor: string | null
          last_synced_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          folder_name?: string
          folder_path: string
          id?: string
          last_cursor?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          folder_name?: string
          folder_path?: string
          id?: string
          last_cursor?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dropbox_watch_settings: {
        Row: {
          default_category: string | null
          default_row: string | null
          dropbox_account: string | null
          folder_url: string | null
          id: number
          updated_at: string
        }
        Insert: {
          default_category?: string | null
          default_row?: string | null
          dropbox_account?: string | null
          folder_url?: string | null
          id: number
          updated_at?: string
        }
        Update: {
          default_category?: string | null
          default_row?: string | null
          dropbox_account?: string | null
          folder_url?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      logo_intro_settings: {
        Row: {
          id: number
          is_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          id: number
          is_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          id?: number
          is_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      lower_third_ads: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          layers: Json | null
          start_time_seconds: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          layers?: Json | null
          start_time_seconds?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          layers?: Json | null
          start_time_seconds?: number | null
          title?: string | null
        }
        Relationships: []
      }
      marquee_ads: {
        Row: {
          background_color: string | null
          created_at: string
          font_color: string | null
          font_family: string | null
          font_size: string | null
          id: string
          is_active: boolean | null
          speed: number | null
          text: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          font_color?: string | null
          font_family?: string | null
          font_size?: string | null
          id?: string
          is_active?: boolean | null
          speed?: number | null
          text: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          font_color?: string | null
          font_family?: string | null
          font_size?: string | null
          id?: string
          is_active?: boolean | null
          speed?: number | null
          text?: string
        }
        Relationships: []
      }
      movie_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          movie_title: string
          production_year: number | null
          status: string | null
          updated_at: string
          user_id: string
          user_notified: boolean | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          movie_title: string
          production_year?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          user_notified?: boolean | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          movie_title?: string
          production_year?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          user_notified?: boolean | null
        }
        Relationships: []
      }
      movies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          dropbox_account: string | null
          id: string
          is_coming_soon: boolean | null
          is_free: boolean | null
          is_series: boolean | null
          part: number | null
          poster_url: string | null
          price_ugx: number | null
          release_date: string | null
          row: string | null
          series_id: string | null
          thumbnail_url: string | null
          title: string
          trailer_url: string | null
          updated_at: string
          video_url: string | null
          video_url_480p: string | null
          video_url_720p: string | null
          vj: string | null
          vj_name: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          dropbox_account?: string | null
          id?: string
          is_coming_soon?: boolean | null
          is_free?: boolean | null
          is_series?: boolean | null
          part?: number | null
          poster_url?: string | null
          price_ugx?: number | null
          release_date?: string | null
          row?: string | null
          series_id?: string | null
          thumbnail_url?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
          video_url?: string | null
          video_url_480p?: string | null
          video_url_720p?: string | null
          vj?: string | null
          vj_name?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          dropbox_account?: string | null
          id?: string
          is_coming_soon?: boolean | null
          is_free?: boolean | null
          is_series?: boolean | null
          part?: number | null
          poster_url?: string | null
          price_ugx?: number | null
          release_date?: string | null
          row?: string | null
          series_id?: string | null
          thumbnail_url?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
          video_url?: string | null
          video_url_480p?: string | null
          video_url_720p?: string | null
          vj?: string | null
          vj_name?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pending_imports: {
        Row: {
          category: string[]
          created_at: string
          description: string
          dropbox_file_id: string
          dropbox_path: string
          duration: string
          error_message: string | null
          genre: string
          id: string
          language: string
          original_filename: string
          parsed_title: string
          parsed_vj: string
          rating: string
          source: string
          source_id: string | null
          source_url: string | null
          status: string
          thumbnail_url: string
          tmdb_id: number | null
          tmdb_matched: boolean
          updated_at: string
          video_url: string
          year: number
        }
        Insert: {
          category?: string[]
          created_at?: string
          description?: string
          dropbox_file_id: string
          dropbox_path: string
          duration?: string
          error_message?: string | null
          genre?: string
          id?: string
          language?: string
          original_filename: string
          parsed_title?: string
          parsed_vj?: string
          rating?: string
          source?: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          thumbnail_url?: string
          tmdb_id?: number | null
          tmdb_matched?: boolean
          updated_at?: string
          video_url?: string
          year?: number
        }
        Update: {
          category?: string[]
          created_at?: string
          description?: string
          dropbox_file_id?: string
          dropbox_path?: string
          duration?: string
          error_message?: string | null
          genre?: string
          id?: string
          language?: string
          original_filename?: string
          parsed_title?: string
          parsed_vj?: string
          rating?: string
          source?: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          thumbnail_url?: string
          tmdb_id?: number | null
          tmdb_matched?: boolean
          updated_at?: string
          video_url?: string
          year?: number
        }
        Relationships: []
      }
      pending_movies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          dropbox_account: string | null
          id: string
          is_finished: boolean | null
          is_free: boolean | null
          last_edited_at: string | null
          price_ugx: number | null
          row: string | null
          source_path: string | null
          status: string | null
          thumbnail_url: string | null
          title: string | null
          video_url: string | null
          vj: string | null
          vj_name: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          dropbox_account?: string | null
          id?: string
          is_finished?: boolean | null
          is_free?: boolean | null
          last_edited_at?: string | null
          price_ugx?: number | null
          row?: string | null
          source_path?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string | null
          vj?: string | null
          vj_name?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          dropbox_account?: string | null
          id?: string
          is_finished?: boolean | null
          is_free?: boolean | null
          last_edited_at?: string | null
          price_ugx?: number | null
          row?: string | null
          source_path?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string | null
          vj?: string | null
          vj_name?: string | null
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          free_credits: number
          id: string
          phone: string | null
          referral_code: string | null
          referral_count: number
          updated_at: string
          user_id: string
          username: string | null
          wallet: number
        }
        Insert: {
          created_at?: string
          free_credits?: number
          id?: string
          phone?: string | null
          referral_code?: string | null
          referral_count?: number
          updated_at?: string
          user_id: string
          username?: string | null
          wallet?: number
        }
        Update: {
          created_at?: string
          free_credits?: number
          id?: string
          phone?: string | null
          referral_code?: string | null
          referral_count?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          wallet?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string
          credits_awarded: number | null
          id: string
          referred_id: string | null
          referrer_id: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number | null
          id?: string
          referred_id?: string | null
          referrer_id: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number | null
          id?: string
          referred_id?: string | null
          referrer_id?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          thumbnail_url: string | null
          title: string
          vj: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title: string
          vj?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          vj?: string | null
        }
        Relationships: []
      }
      squeeze_back_ads: {
        Row: {
          created_at: string
          duration_seconds: number | null
          fit_bottom: boolean | null
          fit_left: boolean | null
          height_percent: number | null
          id: string
          image_url: string | null
          image_url_bottom: string | null
          interval_minutes: number | null
          is_enabled: boolean | null
          link_url: string | null
          link_url_bottom: string | null
          title: string | null
          width_percent: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          fit_bottom?: boolean | null
          fit_left?: boolean | null
          height_percent?: number | null
          id?: string
          image_url?: string | null
          image_url_bottom?: string | null
          interval_minutes?: number | null
          is_enabled?: boolean | null
          link_url?: string | null
          link_url_bottom?: string | null
          title?: string | null
          width_percent?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          fit_bottom?: boolean | null
          fit_left?: boolean | null
          height_percent?: number | null
          id?: string
          image_url?: string | null
          image_url_bottom?: string | null
          interval_minutes?: number | null
          is_enabled?: boolean | null
          link_url?: string | null
          link_url_bottom?: string | null
          title?: string | null
          width_percent?: number | null
        }
        Relationships: []
      }
      sub_admin_invites: {
        Row: {
          created_at: string
          email: string | null
          enabled_features: Json | null
          id: string
          token: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          enabled_features?: Json | null
          id?: string
          token?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          enabled_features?: Json | null
          id?: string
          token?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      sub_admins: {
        Row: {
          created_at: string
          email: string | null
          enabled_features: Json | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          enabled_features?: Json | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          enabled_features?: Json | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          created_at: string
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          key: string | null
          name: string | null
          price_ugx: number | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name?: string | null
          price_ugx?: number | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name?: string | null
          price_ugx?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string
          duration_label: string
          duration_minutes: number
          features: string[]
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string
          duration_label: string
          duration_minutes: number
          features?: string[]
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          duration_label?: string
          duration_minutes?: number
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          package_key: string | null
          source: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_key?: string | null
          source?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_key?: string | null
          source?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      titles: {
        Row: {
          cast_members: string[] | null
          category: string[]
          created_at: string
          description: string
          duration: string
          episode: number
          genre: string
          id: string
          is_coming_soon: boolean
          is_free: boolean
          is_series: boolean
          is_vj: boolean
          language: string
          price: number
          rating: string
          row: string
          season: number
          series_id: string | null
          status: string
          thumbnail: string
          thumbnail_url: string
          title: string
          updated_at: string
          video_url: string
          views: number
          vj_narrator: string
          year: number
        }
        Insert: {
          cast_members?: string[] | null
          category?: string[]
          created_at?: string
          description?: string
          duration?: string
          episode?: number
          genre?: string
          id?: string
          is_coming_soon?: boolean
          is_free?: boolean
          is_series?: boolean
          is_vj?: boolean
          language?: string
          price?: number
          rating?: string
          row?: string
          season?: number
          series_id?: string | null
          status?: string
          thumbnail?: string
          thumbnail_url?: string
          title: string
          updated_at?: string
          video_url?: string
          views?: number
          vj_narrator?: string
          year?: number
        }
        Update: {
          cast_members?: string[] | null
          category?: string[]
          created_at?: string
          description?: string
          duration?: string
          episode?: number
          genre?: string
          id?: string
          is_coming_soon?: boolean
          is_free?: boolean
          is_series?: boolean
          is_vj?: boolean
          language?: string
          price?: number
          rating?: string
          row?: string
          season?: number
          series_id?: string | null
          status?: string
          thumbnail?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string
          video_url?: string
          views?: number
          vj_narrator?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "titles_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          title_id: string | null
          title_name: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          title_id?: string | null
          title_name?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          title_id?: string | null
          title_name?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vj_list: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      wallet_promotions: {
        Row: {
          bonus_percent: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          starts_at: string | null
          title: string | null
        }
        Insert: {
          bonus_percent?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          bonus_percent?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_progress: {
        Row: {
          current_time_seconds: number | null
          duration_seconds: number | null
          id: string
          movie_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_time_seconds?: number | null
          duration_seconds?: number | null
          id?: string
          movie_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_time_seconds?: number | null
          duration_seconds?: number | null
          id?: string
          movie_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
