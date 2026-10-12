// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// types/supabase.ts
// Generated from the real migrated schema (001-005) against a local Postgres
// instance seeded with every migration in this repo — not hand-written, and
// not a leftover from EIKON. See docs/VERIFICATION.md for how.
// Regenerate against a live Supabase project at any time:
//   npm run db:types
// or against any Postgres instance with the migrations applied:
//   npx supabase gen types typescript --db-url "postgresql://..." | npx oxfmt -
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_portraits: {
        Row: {
          assessment_id: string;
          content: NonNullable<Json>;
          generated_at: string;
          id: string;
          pillar: Database["public"]["Enums"]["pillar_name"];
        };
        ComputedFields: never;
        Insert: {
          assessment_id: string;
          content: NonNullable<Json>;
          generated_at?: string;
          id?: string;
          pillar: Database["public"]["Enums"]["pillar_name"];
        };
        Update: {
          assessment_id?: string;
          content?: NonNullable<Json>;
          generated_at?: string;
          id?: string;
          pillar?: Database["public"]["Enums"]["pillar_name"];
        };
        Relationships: [
          {
            foreignKeyName: "ai_portraits_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          completed_at: string | null;
          couple_id: string | null;
          created_at: string;
          cycle_number: number;
          id: string;
          integrity_flags: Json | null;
          last_question_index: number;
          overall_score: number | null;
          participant_acknowledgement: Json | null;
          participant_id: string;
          pillar_descriptors: Json | null;
          pillar_score_overrides: Json | null;
          pillar_scores: Json | null;
          priority_stack: Json | null;
          report_generated_at: string | null;
          scoring_notes: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["assessment_status"];
          track: Database["public"]["Enums"]["assessment_track"];
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          couple_id?: string | null;
          created_at?: string;
          cycle_number?: number;
          id?: string;
          integrity_flags?: Json | null;
          last_question_index?: number;
          overall_score?: number | null;
          participant_acknowledgement?: Json | null;
          participant_id: string;
          pillar_descriptors?: Json | null;
          pillar_score_overrides?: Json | null;
          pillar_scores?: Json | null;
          priority_stack?: Json | null;
          report_generated_at?: string | null;
          scoring_notes?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["assessment_status"];
          track: Database["public"]["Enums"]["assessment_track"];
        };
        Update: {
          completed_at?: string | null;
          couple_id?: string | null;
          created_at?: string;
          cycle_number?: number;
          id?: string;
          integrity_flags?: Json | null;
          last_question_index?: number;
          overall_score?: number | null;
          participant_acknowledgement?: Json | null;
          participant_id?: string;
          pillar_descriptors?: Json | null;
          pillar_score_overrides?: Json | null;
          pillar_scores?: Json | null;
          priority_stack?: Json | null;
          report_generated_at?: string | null;
          scoring_notes?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["assessment_status"];
          track?: Database["public"]["Enums"]["assessment_track"];
        };
        Relationships: [
          {
            foreignKeyName: "assessments_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      couples: {
        Row: {
          created_at: string;
          cycle_number: number;
          guide_id: string | null;
          id: string;
          invite_code: string;
          invite_email: string | null;
          partner_a_id: string;
          partner_b_id: string | null;
          status: Database["public"]["Enums"]["couple_status"];
          track: Database["public"]["Enums"]["assessment_track"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          cycle_number?: number;
          guide_id?: string | null;
          id?: string;
          invite_code: string;
          invite_email?: string | null;
          partner_a_id: string;
          partner_b_id?: string | null;
          status?: Database["public"]["Enums"]["couple_status"];
          track: Database["public"]["Enums"]["assessment_track"];
        };
        Update: {
          created_at?: string;
          cycle_number?: number;
          guide_id?: string | null;
          id?: string;
          invite_code?: string;
          invite_email?: string | null;
          partner_a_id?: string;
          partner_b_id?: string | null;
          status?: Database["public"]["Enums"]["couple_status"];
          track?: Database["public"]["Enums"]["assessment_track"];
        };
        Relationships: [
          {
            foreignKeyName: "couples_guide_id_fkey";
            columns: ["guide_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couples_partner_a_id_fkey";
            columns: ["partner_a_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couples_partner_b_id_fkey";
            columns: ["partner_b_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      email_log: {
        Row: {
          email_type: string;
          id: string;
          recipient_id: string;
          sent_at: string;
        };
        ComputedFields: never;
        Insert: {
          email_type: string;
          id?: string;
          recipient_id: string;
          sent_at?: string;
        };
        Update: {
          email_type?: string;
          id?: string;
          recipient_id?: string;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_log_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fruit_reflections: {
        Row: {
          created_at: string;
          fruit: Database["public"]["Enums"]["fruit_name"];
          id: string;
          participant_id: string;
          reflection_text: string;
          shared_with_guide: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          fruit: Database["public"]["Enums"]["fruit_name"];
          id?: string;
          participant_id: string;
          reflection_text: string;
          shared_with_guide?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          fruit?: Database["public"]["Enums"]["fruit_name"];
          id?: string;
          participant_id?: string;
          reflection_text?: string;
          shared_with_guide?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fruit_reflections_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guide_briefings: {
        Row: {
          content: NonNullable<Json>;
          couple_id: string;
          generated_at: string;
          guide_id: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          content: NonNullable<Json>;
          couple_id: string;
          generated_at?: string;
          guide_id: string;
          id?: string;
        };
        Update: {
          content?: NonNullable<Json>;
          couple_id?: string;
          generated_at?: string;
          guide_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guide_briefings_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guide_briefings_guide_id_fkey";
            columns: ["guide_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          guide_id: string | null;
          id: string;
          intended_track: Database["public"]["Enums"]["assessment_track"] | null;
          notification_preferences: NonNullable<Json>;
          onboarding_completed: boolean;
          relationship_history: Json | null;
          role: Database["public"]["Enums"]["user_role"];
          subscription_status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          guide_id?: string | null;
          id: string;
          intended_track?: Database["public"]["Enums"]["assessment_track"] | null;
          notification_preferences?: NonNullable<Json>;
          onboarding_completed?: boolean;
          relationship_history?: Json | null;
          role?: Database["public"]["Enums"]["user_role"];
          subscription_status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          guide_id?: string | null;
          id?: string;
          intended_track?: Database["public"]["Enums"]["assessment_track"] | null;
          notification_preferences?: NonNullable<Json>;
          onboarding_completed?: boolean;
          relationship_history?: Json | null;
          role?: Database["public"]["Enums"]["user_role"];
          subscription_status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_profiles_guide";
            columns: ["guide_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          cross_ref_questions: Json | null;
          id: string;
          integrity_flag_logic: Json | null;
          pillar: Database["public"]["Enums"]["pillar_name"];
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          scale_reversed: boolean;
          scoring_rubric: NonNullable<Json>;
          sequence_order: number;
          track: Database["public"]["Enums"]["assessment_track"];
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          cross_ref_questions?: Json | null;
          id?: string;
          integrity_flag_logic?: Json | null;
          pillar: Database["public"]["Enums"]["pillar_name"];
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          scale_reversed?: boolean;
          scoring_rubric?: NonNullable<Json>;
          sequence_order: number;
          track: Database["public"]["Enums"]["assessment_track"];
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          cross_ref_questions?: Json | null;
          id?: string;
          integrity_flag_logic?: Json | null;
          pillar?: Database["public"]["Enums"]["pillar_name"];
          question_text?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          scale_reversed?: boolean;
          scoring_rubric?: NonNullable<Json>;
          sequence_order?: number;
          track?: Database["public"]["Enums"]["assessment_track"];
        };
        Relationships: [];
      };
      report_content: {
        Row: {
          active: boolean;
          content_key: string;
          content_text: string;
          content_type: string;
          created_at: string;
          descriptor: Database["public"]["Enums"]["formation_descriptor"] | null;
          id: string;
          pillar: Database["public"]["Enums"]["pillar_name"] | null;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          content_key: string;
          content_text: string;
          content_type: string;
          created_at?: string;
          descriptor?: Database["public"]["Enums"]["formation_descriptor"] | null;
          id?: string;
          pillar?: Database["public"]["Enums"]["pillar_name"] | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          content_key?: string;
          content_text?: string;
          content_type?: string;
          created_at?: string;
          descriptor?: Database["public"]["Enums"]["formation_descriptor"] | null;
          id?: string;
          pillar?: Database["public"]["Enums"]["pillar_name"] | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          answered_at: string;
          assessment_id: string;
          computed_score: number | null;
          descriptor_assigned: Database["public"]["Enums"]["formation_descriptor"] | null;
          flags_raised: Json | null;
          id: string;
          participant_id: string;
          question_id: string;
          response_scale: number | null;
          response_text: string | null;
          response_time_seconds: number | null;
          word_count: number | null;
        };
        ComputedFields: never;
        Insert: {
          answered_at?: string;
          assessment_id: string;
          computed_score?: number | null;
          descriptor_assigned?: Database["public"]["Enums"]["formation_descriptor"] | null;
          flags_raised?: Json | null;
          id?: string;
          participant_id: string;
          question_id: string;
          response_scale?: number | null;
          response_text?: string | null;
          response_time_seconds?: number | null;
          word_count?: number | null;
        };
        Update: {
          answered_at?: string;
          assessment_id?: string;
          computed_score?: number | null;
          descriptor_assigned?: Database["public"]["Enums"]["formation_descriptor"] | null;
          flags_raised?: Json | null;
          id?: string;
          participant_id?: string;
          question_id?: string;
          response_scale?: number | null;
          response_text?: string | null;
          response_time_seconds?: number | null;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "responses_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          couple_id: string;
          created_at: string;
          current_period_end: string | null;
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_subscription_id: string;
          status: Database["public"]["Enums"]["payment_status"];
        };
        ComputedFields: never;
        Insert: {
          couple_id: string;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_subscription_id: string;
          status: Database["public"]["Enums"]["payment_status"];
        };
        Update: {
          couple_id?: string;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_subscription_id?: string;
          status?: Database["public"]["Enums"]["payment_status"];
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auth_uid: { Args: Record<PropertyKey, never>; Returns: string };
      dearmor: { Args: { "": string }; Returns: string };
      gen_random_uuid: { Args: Record<PropertyKey, never>; Returns: string };
      gen_salt: { Args: { "": string }; Returns: string };
      get_user_role: { Args: Record<PropertyKey, never>; Returns: string };
      is_guide_of_couple: { Args: { p_couple_id: string }; Returns: boolean };
      is_guide_of_participant: { Args: { p_participant_id: string }; Returns: boolean };
      is_partner_in_couple: { Args: { p_couple_id: string }; Returns: boolean };
      pgp_armor_headers: { Args: { "": string }; Returns: Record<string, unknown>[] };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
      uuid_generate_v1: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_generate_v1mc: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_generate_v3: { Args: { name: string; namespace: string }; Returns: string };
      uuid_generate_v4: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_generate_v5: { Args: { name: string; namespace: string }; Returns: string };
      uuid_nil: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_ns_dns: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_ns_oid: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_ns_url: { Args: Record<PropertyKey, never>; Returns: string };
      uuid_ns_x500: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      assessment_status: "not_started" | "in_progress" | "completed" | "report_generated";
      assessment_track: "premarital" | "married" | "readiness";
      couple_status: "pending" | "active";
      formation_descriptor: "christformed" | "rooted" | "growing" | "awakening" | "unengaged";
      fruit_name:
        | "love"
        | "joy"
        | "peace"
        | "patience"
        | "kindness"
        | "goodness"
        | "faithfulness"
        | "gentleness"
        | "self_control";
      partner_slot: "partner_a" | "partner_b";
      payment_provider: "paystack" | "flutterwave" | "paypal";
      payment_status: "active" | "cancelled" | "past_due" | "trialing";
      pillar_name:
        | "covenant_faithfulness"
        | "oneness"
        | "sacrificial_love"
        | "intimacy"
        | "truthful_communication"
        | "conflict_repair"
        | "mutual_honor"
        | "shared_vision"
        | "cross_pillar";
      question_type: "scenario" | "frequency" | "reflective_disclosure";
      subscription_status: "trial" | "active" | "paused" | "expired";
      user_role: "participant" | "guide" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      assessment_status: ["not_started", "in_progress", "completed", "report_generated"],
      assessment_track: ["premarital", "married", "readiness"],
      couple_status: ["pending", "active"],
      formation_descriptor: ["christformed", "rooted", "growing", "awakening", "unengaged"],
      fruit_name: [
        "love",
        "joy",
        "peace",
        "patience",
        "kindness",
        "goodness",
        "faithfulness",
        "gentleness",
        "self_control",
      ],
      partner_slot: ["partner_a", "partner_b"],
      payment_provider: ["paystack", "flutterwave", "paypal"],
      payment_status: ["active", "cancelled", "past_due", "trialing"],
      pillar_name: [
        "covenant_faithfulness",
        "oneness",
        "sacrificial_love",
        "intimacy",
        "truthful_communication",
        "conflict_repair",
        "mutual_honor",
        "shared_vision",
        "cross_pillar",
      ],
      question_type: ["scenario", "frequency", "reflective_disclosure"],
      subscription_status: ["trial", "active", "paused", "expired"],
      user_role: ["participant", "guide", "admin"],
    },
  },
} as const;
