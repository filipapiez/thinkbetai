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
      access_code_redemption_attempts: {
        Row: {
          code: string | null
          created_at: string
          id: string
          reason: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      access_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          id: string
          is_active: boolean
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Relationships: []
      }
      active_bets: {
        Row: {
          away_score: number | null
          away_team: string
          bookmaker: string | null
          closing_bookmaker: string | null
          closing_captured_at: string | null
          closing_line: number | null
          closing_odds: number | null
          clv_cents: number | null
          clv_percent: number | null
          confidence: number
          created_at: string
          edge: number
          expected_value: number | null
          game_id: string
          game_time: string
          home_score: number | null
          home_team: string
          id: string
          implied_probability: number | null
          line: number | null
          market_type: string | null
          model_probability: number | null
          odds: number
          odds_source: string | null
          opening_odds: number | null
          pick: string
          pick_odds: number | null
          pick_type: string
          pick_value: number | null
          published_at: string | null
          result: string | null
          source_event_id: string | null
          sport: string
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          bookmaker?: string | null
          closing_bookmaker?: string | null
          closing_captured_at?: string | null
          closing_line?: number | null
          closing_odds?: number | null
          clv_cents?: number | null
          clv_percent?: number | null
          confidence?: number
          created_at?: string
          edge?: number
          expected_value?: number | null
          game_id: string
          game_time: string
          home_score?: number | null
          home_team: string
          id?: string
          implied_probability?: number | null
          line?: number | null
          market_type?: string | null
          model_probability?: number | null
          odds?: number
          odds_source?: string | null
          opening_odds?: number | null
          pick: string
          pick_odds?: number | null
          pick_type?: string
          pick_value?: number | null
          published_at?: string | null
          result?: string | null
          source_event_id?: string | null
          sport: string
          status?: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          bookmaker?: string | null
          closing_bookmaker?: string | null
          closing_captured_at?: string | null
          closing_line?: number | null
          closing_odds?: number | null
          clv_cents?: number | null
          clv_percent?: number | null
          confidence?: number
          created_at?: string
          edge?: number
          expected_value?: number | null
          game_id?: string
          game_time?: string
          home_score?: number | null
          home_team?: string
          id?: string
          implied_probability?: number | null
          line?: number | null
          market_type?: string | null
          model_probability?: number | null
          odds?: number
          odds_source?: string | null
          opening_odds?: number | null
          pick?: string
          pick_odds?: number | null
          pick_type?: string
          pick_value?: number | null
          published_at?: string | null
          result?: string | null
          source_event_id?: string | null
          sport?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_picks: {
        Row: {
          away_team: string | null
          confidence: number | null
          created_at: string
          direction: string | null
          game_date: string | null
          home_team: string | null
          id: string
          line: number | null
          notes: string | null
          odds: number | null
          pick: string
          pick_type: string
          player_name: string | null
          prop_type: string | null
          result: string | null
          sport: string
          updated_at: string
        }
        Insert: {
          away_team?: string | null
          confidence?: number | null
          created_at?: string
          direction?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: string
          line?: number | null
          notes?: string | null
          odds?: number | null
          pick: string
          pick_type?: string
          player_name?: string | null
          prop_type?: string | null
          result?: string | null
          sport?: string
          updated_at?: string
        }
        Update: {
          away_team?: string | null
          confidence?: number | null
          created_at?: string
          direction?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: string
          line?: number | null
          notes?: string | null
          odds?: number | null
          pick?: string
          pick_type?: string
          player_name?: string | null
          prop_type?: string | null
          result?: string | null
          sport?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      historical_bets: {
        Row: {
          away_team: string
          bookmaker: string | null
          closing_bookmaker: string | null
          closing_captured_at: string | null
          closing_line: number | null
          closing_odds: number | null
          clv_cents: number | null
          clv_percent: number | null
          confidence: number
          created_at: string
          date: string
          edge: number
          expected_value: number | null
          home_team: string
          id: string
          implied_probability: number | null
          line: number | null
          market_type: string | null
          model_probability: number | null
          odds: number
          odds_source: string | null
          opening_odds: number | null
          pick: string
          pick_odds: number | null
          published_at: string | null
          result: string
          source_event_id: string | null
          sport: string
        }
        Insert: {
          away_team: string
          bookmaker?: string | null
          closing_bookmaker?: string | null
          closing_captured_at?: string | null
          closing_line?: number | null
          closing_odds?: number | null
          clv_cents?: number | null
          clv_percent?: number | null
          confidence: number
          created_at?: string
          date: string
          edge: number
          expected_value?: number | null
          home_team: string
          id?: string
          implied_probability?: number | null
          line?: number | null
          market_type?: string | null
          model_probability?: number | null
          odds: number
          odds_source?: string | null
          opening_odds?: number | null
          pick: string
          pick_odds?: number | null
          published_at?: string | null
          result: string
          source_event_id?: string | null
          sport: string
        }
        Update: {
          away_team?: string
          bookmaker?: string | null
          closing_bookmaker?: string | null
          closing_captured_at?: string | null
          closing_line?: number | null
          closing_odds?: number | null
          clv_cents?: number | null
          clv_percent?: number | null
          confidence?: number
          created_at?: string
          date?: string
          edge?: number
          expected_value?: number | null
          home_team?: string
          id?: string
          implied_probability?: number | null
          line?: number | null
          market_type?: string | null
          model_probability?: number | null
          odds?: number
          odds_source?: string | null
          opening_odds?: number | null
          pick?: string
          pick_odds?: number | null
          published_at?: string | null
          result?: string
          source_event_id?: string | null
          sport?: string
        }
        Relationships: []
      }
      odds_cache: {
        Row: {
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          expires_at: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      odds_closing_snapshots: {
        Row: {
          active_bet_id: string | null
          bookmaker: string
          captured_at: string
          created_at: string
          game_id: string
          id: string
          line: number | null
          market_type: string
          odds: number
          raw: Json
          sport: string
        }
        Insert: {
          active_bet_id?: string | null
          bookmaker: string
          captured_at?: string
          created_at?: string
          game_id: string
          id?: string
          line?: number | null
          market_type: string
          odds: number
          raw?: Json
          sport: string
        }
        Update: {
          active_bet_id?: string | null
          bookmaker?: string
          captured_at?: string
          created_at?: string
          game_id?: string
          id?: string
          line?: number | null
          market_type?: string
          odds?: number
          raw?: Json
          sport?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_type: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          email: string | null
          first_name: string | null
          has_access: boolean
          id: string
          last_name: string | null
          price_id: string | null
          promo_used: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          first_name?: string | null
          has_access?: boolean
          id?: string
          last_name?: string | null
          price_id?: string | null
          promo_used?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          first_name?: string | null
          has_access?: boolean
          id?: string
          last_name?: string | null
          price_id?: string | null
          promo_used?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          is_verified: boolean
          name: string
          quote: string
          rating: number
          role: string | null
          source: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          is_verified?: boolean
          name: string
          quote: string
          rating: number
          role?: string | null
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          is_verified?: boolean
          name?: string
          quote?: string
          rating?: number
          role?: string | null
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      seo_page_errors: {
        Row: {
          created_at: string
          id: string
          page_type: string | null
          payload_json: Json | null
          reason: string
          run_id: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_type?: string | null
          payload_json?: Json | null
          reason: string
          run_id?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_type?: string | null
          payload_json?: Json | null
          reason?: string
          run_id?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_page_errors_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "seo_run_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          content_json: Json
          created_at: string
          entity_id: string | null
          game_date: string | null
          h1: string | null
          id: string
          last_data_hash: string | null
          meta_description: string | null
          page_type: string
          published_at: string
          slug: string
          sport: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content_json?: Json
          created_at?: string
          entity_id?: string | null
          game_date?: string | null
          h1?: string | null
          id?: string
          last_data_hash?: string | null
          meta_description?: string | null
          page_type: string
          published_at?: string
          slug: string
          sport?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content_json?: Json
          created_at?: string
          entity_id?: string | null
          game_date?: string | null
          h1?: string | null
          id?: string
          last_data_hash?: string | null
          meta_description?: string | null
          page_type?: string
          published_at?: string
          slug?: string
          sport?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_run_logs: {
        Row: {
          created_at: string
          errors_json: Json | null
          finished_at: string | null
          id: string
          job_name: string
          next_run_at: string | null
          pages_created: number
          pages_failed: number
          pages_updated: number
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          errors_json?: Json | null
          finished_at?: string | null
          id?: string
          job_name: string
          next_run_at?: string | null
          pages_created?: number
          pages_failed?: number
          pages_updated?: number
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          errors_json?: Json | null
          finished_at?: string | null
          id?: string
          job_name?: string
          next_run_at?: string | null
          pages_created?: number
          pages_failed?: number
          pages_updated?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_logos_cache: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          source: string | null
          sport: string | null
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          source?: string | null
          sport?: string | null
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          source?: string | null
          sport?: string | null
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_parlays: {
        Row: {
          created_at: string
          id: string
          picks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          picks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          picks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
