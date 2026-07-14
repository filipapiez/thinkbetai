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
          confidence: number
          created_at: string
          edge: number
          game_id: string
          game_time: string
          home_score: number | null
          home_team: string
          id: string
          odds: number
          pick: string
          pick_type: string
          pick_value: number | null
          result: string | null
          sport: string
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          confidence?: number
          created_at?: string
          edge?: number
          game_id: string
          game_time: string
          home_score?: number | null
          home_team: string
          id?: string
          odds?: number
          pick: string
          pick_type?: string
          pick_value?: number | null
          result?: string | null
          sport: string
          status?: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          confidence?: number
          created_at?: string
          edge?: number
          game_id?: string
          game_time?: string
          home_score?: number | null
          home_team?: string
          id?: string
          odds?: number
          pick?: string
          pick_type?: string
          pick_value?: number | null
          result?: string | null
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
      alert_rules: {
        Row: {
          cooldown_seconds: number
          created_at: string
          discord_webhook_url: string | null
          edge_types: string[] | null
          email_to: string | null
          id: string
          is_enabled: boolean
          last_fired_at: string | null
          min_ev_pct: number | null
          min_middle_size: number | null
          min_profit_pct: number | null
          name: string
          sport_keys: string[] | null
          sports: string[] | null
          updated_at: string
        }
        Insert: {
          cooldown_seconds?: number
          created_at?: string
          discord_webhook_url?: string | null
          edge_types?: string[] | null
          email_to?: string | null
          id?: string
          is_enabled?: boolean
          last_fired_at?: string | null
          min_ev_pct?: number | null
          min_middle_size?: number | null
          min_profit_pct?: number | null
          name: string
          sport_keys?: string[] | null
          sports?: string[] | null
          updated_at?: string
        }
        Update: {
          cooldown_seconds?: number
          created_at?: string
          discord_webhook_url?: string | null
          edge_types?: string[] | null
          email_to?: string | null
          id?: string
          is_enabled?: boolean
          last_fired_at?: string | null
          min_ev_pct?: number | null
          min_middle_size?: number | null
          min_profit_pct?: number | null
          name?: string
          sport_keys?: string[] | null
          sports?: string[] | null
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
          confidence: number
          created_at: string
          date: string
          edge: number
          home_team: string
          id: string
          odds: number
          pick: string
          result: string
          sport: string
        }
        Insert: {
          away_team: string
          confidence: number
          created_at?: string
          date: string
          edge: number
          home_team: string
          id?: string
          odds: number
          pick: string
          result: string
          sport: string
        }
        Update: {
          away_team?: string
          confidence?: number
          created_at?: string
          date?: string
          edge?: number
          home_team?: string
          id?: string
          odds?: number
          pick?: string
          result?: string
          sport?: string
        }
        Relationships: []
      }
      odds_board_latest: {
        Row: {
          book: string
          commence_time: string
          dedup_key: string
          event: string
          id: string
          market: string
          odds_api_event_id: string
          opening_point: number | null
          opening_price: number
          outcome: string
          point: number | null
          price: number
          sport: string
          updated_at: string
        }
        Insert: {
          book: string
          commence_time: string
          dedup_key: string
          event: string
          id?: string
          market: string
          odds_api_event_id: string
          opening_point?: number | null
          opening_price: number
          outcome: string
          point?: number | null
          price: number
          sport: string
          updated_at?: string
        }
        Update: {
          book?: string
          commence_time?: string
          dedup_key?: string
          event?: string
          id?: string
          market?: string
          odds_api_event_id?: string
          opening_point?: number | null
          opening_price?: number
          outcome?: string
          point?: number | null
          price?: number
          sport?: string
          updated_at?: string
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
      odds_history: {
        Row: {
          book: string
          changed_at: string
          dedup_key: string
          id: number
          market: string
          new_point: number | null
          new_price: number | null
          odds_api_event_id: string
          old_point: number | null
          old_price: number | null
          outcome: string
        }
        Insert: {
          book: string
          changed_at?: string
          dedup_key: string
          id?: never
          market: string
          new_point?: number | null
          new_price?: number | null
          odds_api_event_id: string
          old_point?: number | null
          old_price?: number | null
          outcome: string
        }
        Update: {
          book?: string
          changed_at?: string
          dedup_key?: string
          id?: never
          market?: string
          new_point?: number | null
          new_price?: number | null
          odds_api_event_id?: string
          old_point?: number | null
          old_price?: number | null
          outcome?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          book: string
          book_count: number
          commence_time: string
          detected_at: string
          edge_type: string
          ev_pct: number
          event: string
          expires_at: string
          extra: Json | null
          fair_odds_decimal: number
          fair_prob: number
          id: string
          line: number | null
          market: string
          odds_american: number
          odds_decimal: number
          selection: string
          sport: string
          sport_key: string
        }
        Insert: {
          book: string
          book_count?: number
          commence_time: string
          detected_at?: string
          edge_type?: string
          ev_pct: number
          event: string
          expires_at?: string
          extra?: Json | null
          fair_odds_decimal: number
          fair_prob: number
          id?: string
          line?: number | null
          market: string
          odds_american: number
          odds_decimal: number
          selection: string
          sport: string
          sport_key: string
        }
        Update: {
          book?: string
          book_count?: number
          commence_time?: string
          detected_at?: string
          edge_type?: string
          ev_pct?: number
          event?: string
          expires_at?: string
          extra?: Json | null
          fair_odds_decimal?: number
          fair_prob?: number
          id?: string
          line?: number | null
          market?: string
          odds_american?: number
          odds_decimal?: number
          selection?: string
          sport?: string
          sport_key?: string
        }
        Relationships: []
      }
      picks: {
        Row: {
          book: string | null
          closing_odds_decimal: number | null
          clv_pct: number | null
          created_at: string
          ev_pct: number | null
          event: string
          fair_prob: number
          id: string
          is_published: boolean
          market: string
          odds_decimal: number
          pl_units: number | null
          posted_at: string
          result: Database["public"]["Enums"]["pick_result"]
          selection: string
          settled_at: string | null
          sport: string
          stake_units: number
        }
        Insert: {
          book?: string | null
          closing_odds_decimal?: number | null
          clv_pct?: number | null
          created_at?: string
          ev_pct?: number | null
          event: string
          fair_prob: number
          id?: string
          is_published?: boolean
          market: string
          odds_decimal: number
          pl_units?: number | null
          posted_at?: string
          result?: Database["public"]["Enums"]["pick_result"]
          selection: string
          settled_at?: string | null
          sport: string
          stake_units?: number
        }
        Update: {
          book?: string | null
          closing_odds_decimal?: number | null
          clv_pct?: number | null
          created_at?: string
          ev_pct?: number | null
          event?: string
          fair_prob?: number
          id?: string
          is_published?: boolean
          market?: string
          odds_decimal?: number
          pl_units?: number | null
          posted_at?: string
          result?: Database["public"]["Enums"]["pick_result"]
          selection?: string
          settled_at?: string | null
          sport?: string
          stake_units?: number
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
      proof_stats: {
        Row: {
          avg_clv_pct: number | null
          closing_brier: number | null
          graded_picks: number | null
          losses: number | null
          model_brier: number | null
          net_units: number | null
          roi_pct: number | null
          win_rate_pct: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      prune_odds_board: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      pick_result: "pending" | "win" | "loss" | "push" | "void"
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
      pick_result: ["pending", "win", "loss", "push", "void"],
    },
  },
} as const
