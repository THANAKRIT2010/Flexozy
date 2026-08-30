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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          image: string | null
          link: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          link?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          link?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          name: string | null
          sound_id: string
          thumbnail: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          name?: string | null
          sound_id: string
          thumbnail?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          name?: string | null
          sound_id?: string
          thumbnail?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_name: string | null
          created_at: string
          delivered_content: string | null
          id: string
          price: number
          product_id: string | null
          product_title: string
          status: string
        }
        Insert: {
          buyer_id: string
          buyer_name?: string | null
          created_at?: string
          delivered_content?: string | null
          id?: string
          price?: number
          product_id?: string | null
          product_title?: string
          status?: string
        }
        Update: {
          buyer_id?: string
          buyer_name?: string | null
          created_at?: string
          delivered_content?: string | null
          id?: string
          price?: number
          product_id?: string | null
          product_title?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          avatar: string | null
          created_at: string
          description: string | null
          discord_invite: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          description?: string | null
          discord_invite?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          avatar?: string | null
          created_at?: string
          description?: string | null
          discord_invite?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          price: number
          stock: number
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          price?: number
          stock?: number
          title: string
          type?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          price?: number
          stock?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned: boolean
          bio: string | null
          created_at: string
          id: string
          username: string
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned?: boolean
          bio?: string | null
          created_at?: string
          id: string
          username?: string
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          username?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      redeem_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          max_uses: number
          reward_type: string
          reward_value: string
          uses: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          max_uses?: number
          reward_type?: string
          reward_value?: string
          uses?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          max_uses?: number
          reward_type?: string
          reward_value?: string
          uses?: number
        }
        Relationships: []
      }
      redeem_uses: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeem_uses_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "redeem_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string | null
          reporter_name: string | null
          status: string
          target_id: string | null
          target_label: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string | null
          reporter_name?: string | null
          status?: string
          target_id?: string | null
          target_label?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          reporter_name?: string | null
          status?: string
          target_id?: string | null
          target_label?: string | null
          type?: string
        }
        Relationships: []
      }
      roblox_genres: {
        Row: {
          id: string
          image: string | null
          sort_order: number
          title: string
        }
        Insert: {
          id: string
          image?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          id?: string
          image?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      roblox_sounds: {
        Row: {
          added_by: string | null
          added_by_name: string | null
          created_at: string
          creator: string | null
          genre_id: string | null
          id: string
          name: string
          thumbnail: string | null
          verified: boolean
        }
        Insert: {
          added_by?: string | null
          added_by_name?: string | null
          created_at?: string
          creator?: string | null
          genre_id?: string | null
          id: string
          name: string
          thumbnail?: string | null
          verified?: boolean
        }
        Update: {
          added_by?: string | null
          added_by_name?: string | null
          created_at?: string
          creator?: string | null
          genre_id?: string | null
          id?: string
          name?: string
          thumbnail?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      script_likes: {
        Row: {
          created_at: string
          script_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          script_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          script_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_likes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          approved: boolean
          author_avatar: string | null
          author_id: string | null
          author_name: string
          created_at: string
          game: string
          id: string
          image: string | null
          key_system: boolean
          likes: number
          script: string
          title: string
        }
        Insert: {
          approved?: boolean
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string
          created_at?: string
          game?: string
          id?: string
          image?: string | null
          key_system?: boolean
          likes?: number
          script?: string
          title: string
        }
        Update: {
          approved?: boolean
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string
          created_at?: string
          game?: string
          id?: string
          image?: string | null
          key_system?: boolean
          likes?: number
          script?: string
          title?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          announcement_text: string | null
          discord_invite: string | null
          id: boolean
          logo_url: string | null
          maintenance_enabled: boolean
          maintenance_html: string | null
          popup_button_link: string | null
          popup_button_text: string | null
          popup_code: string | null
          popup_desc: string | null
          popup_enabled: boolean
          popup_image: string | null
          popup_title: string | null
          site_name: string
          tagline: string
          updated_at: string
        }
        Insert: {
          announcement_text?: string | null
          discord_invite?: string | null
          id?: boolean
          logo_url?: string | null
          maintenance_enabled?: boolean
          maintenance_html?: string | null
          popup_button_link?: string | null
          popup_button_text?: string | null
          popup_code?: string | null
          popup_desc?: string | null
          popup_enabled?: boolean
          popup_image?: string | null
          popup_title?: string | null
          site_name?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          announcement_text?: string | null
          discord_invite?: string | null
          id?: boolean
          logo_url?: string | null
          maintenance_enabled?: boolean
          maintenance_html?: string | null
          popup_button_link?: string | null
          popup_button_text?: string | null
          popup_code?: string | null
          popup_desc?: string | null
          popup_enabled?: boolean
          popup_image?: string | null
          popup_title?: string | null
          site_name?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          handle: string | null
          id: string
          role: string | null
          sort_order: number
          username: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          role?: string | null
          sort_order?: number
          username: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          role?: string | null
          sort_order?: number
          username?: string
        }
        Relationships: []
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
      vault_items: {
        Row: {
          code: string
          created_at: string
          id: string
          owner_id: string | null
          owner_name: string | null
          password_hash: string | null
          script: string
          title: string
          views: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          owner_id?: string | null
          owner_name?: string | null
          password_hash?: string | null
          script: string
          title: string
          views?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          owner_id?: string | null
          owner_name?: string | null
          password_hash?: string | null
          script?: string
          title?: string
          views?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          ref: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ref?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ref?: string | null
          type?: string
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
