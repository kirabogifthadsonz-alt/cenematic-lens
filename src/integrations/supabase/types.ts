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
