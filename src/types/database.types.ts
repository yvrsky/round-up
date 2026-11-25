// Generated from supabase/migrations by `supabase gen types typescript`. Do not edit by hand.
// Regenerate: sh scripts/db-test/gen-types.sh

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "gyms": {
                  Row: {
                    "address": string,"created_at": string,"currency": string,"drop_in_fee_cents": number | null,"id": string,"is_partner": boolean,"location": unknown,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"created_at"?: string,"currency"?: string,"drop_in_fee_cents"?: number | null,"id"?: string,"is_partner"?: boolean,"location": unknown,"name": string
                  }
                  Update: {
                    "address"?: string,"created_at"?: string,"currency"?: string,"drop_in_fee_cents"?: number | null,"id"?: string,"is_partner"?: boolean,"location"?: unknown,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"session_messages": {
                  Row: {
                    "content": string,"created_at": string,"id": string,"is_preset": boolean,"sender_id": string,"session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"id"?: string,"is_preset"?: boolean,"sender_id"?: string,"session_id": string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"id"?: string,"is_preset"?: boolean,"sender_id"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_messages_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "session_details"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_messages_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "training_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"session_requests": {
                  Row: {
                    "applicant_id": string,"created_at": string,"id": string,"message": string | null,"session_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "applicant_id"?: string,"created_at"?: string,"id"?: string,"message"?: string | null,"session_id": string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "applicant_id"?: string,"created_at"?: string,"id"?: string,"message"?: string | null,"session_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_requests_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_requests_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "session_details"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_requests_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "training_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"session_reviews": {
                  Row: {
                    "comment": string | null,"control_score": number,"created_at": string,"id": string,"punctuality_score": number,"reviewee_id": string,"reviewer_id": string,"session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"control_score": number,"created_at"?: string,"id"?: string,"punctuality_score": number,"reviewee_id": string,"reviewer_id"?: string,"session_id": string
                  }
                  Update: {
                    "comment"?: string | null,"control_score"?: number,"created_at"?: string,"id"?: string,"punctuality_score"?: number,"reviewee_id"?: string,"reviewer_id"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_reviews_reviewee_id_fkey"
      columns: ["reviewee_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_reviews_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_reviews_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "session_details"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_reviews_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "training_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"training_sessions": {
                  Row: {
                    "created_at": string,"creator_id": string,"custom_location": unknown,"discipline_slug": Database["public"]['Enums']["discipline_slug"],"gym_id": string | null,"id": string,"intensity": Database["public"]['Enums']["session_intensity"],"matched_partner_id": string | null,"max_partner_weight": number | null,"min_partner_weight": number | null,"notes": string | null,"rounds_format": string | null,"scheduled_at": string,"status": Database["public"]['Enums']["session_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"creator_id"?: string,"custom_location"?: unknown,"discipline_slug": Database["public"]['Enums']["discipline_slug"],"gym_id"?: string | null,"id"?: string,"intensity": Database["public"]['Enums']["session_intensity"],"matched_partner_id"?: string | null,"max_partner_weight"?: number | null,"min_partner_weight"?: number | null,"notes"?: string | null,"rounds_format"?: string | null,"scheduled_at": string,"status"?: Database["public"]['Enums']["session_status"]
                  }
                  Update: {
                    "created_at"?: string,"creator_id"?: string,"custom_location"?: unknown,"discipline_slug"?: Database["public"]['Enums']["discipline_slug"],"gym_id"?: string | null,"id"?: string,"intensity"?: Database["public"]['Enums']["session_intensity"],"matched_partner_id"?: string | null,"max_partner_weight"?: number | null,"min_partner_weight"?: number | null,"notes"?: string | null,"rounds_format"?: string | null,"scheduled_at"?: string,"status"?: Database["public"]['Enums']["session_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "training_sessions_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_matched_partner_id_fkey"
      columns: ["matched_partner_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"user_disciplines": {
                  Row: {
                    "created_at": string,"discipline_slug": Database["public"]['Enums']["discipline_slug"],"equipment": NonNullable<Json>,"experience_months": number,"id": string,"rank_label": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"discipline_slug": Database["public"]['Enums']["discipline_slug"],"equipment"?: NonNullable<Json>,"experience_months"?: number,"id"?: string,"rank_label"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"discipline_slug"?: Database["public"]['Enums']["discipline_slug"],"equipment"?: NonNullable<Json>,"experience_months"?: number,"id"?: string,"rank_label"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_disciplines_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "avatar_url": string | null,"base_location": unknown,"completed_sessions_count": number,"control_rating": number,"created_at": string,"email": string | null,"full_name": string | null,"height_cm": number | null,"home_gym_id": string | null,"id": string,"is_verified": boolean,"onboarding_completed_at": string | null,"stance": Database["public"]['Enums']["stance"] | null,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"base_location"?: unknown,"completed_sessions_count"?: number,"control_rating"?: number,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"height_cm"?: number | null,"home_gym_id"?: string | null,"id": string,"is_verified"?: boolean,"onboarding_completed_at"?: string | null,"stance"?: Database["public"]['Enums']["stance"] | null,"weight_kg"?: number | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"base_location"?: unknown,"completed_sessions_count"?: number,"control_rating"?: number,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"height_cm"?: number | null,"home_gym_id"?: string | null,"id"?: string,"is_verified"?: boolean,"onboarding_completed_at"?: string | null,"stance"?: Database["public"]['Enums']["stance"] | null,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "users_home_gym_id_fkey"
      columns: ["home_gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "session_details": {
                  Row: {
                    "created_at": string,"creator_avatar_url": string | null,"creator_completed_sessions": number,"creator_control_rating": number,"creator_id": string,"creator_is_verified": boolean,"creator_name": string | null,"creator_weight_kg": number | null,"currency": string | null,"discipline_slug": Database["public"]['Enums']["discipline_slug"],"drop_in_fee_cents": number | null,"gym_id": string | null,"id": string,"intensity": Database["public"]['Enums']["session_intensity"],"latitude": number | null,"longitude": number | null,"matched_partner_id": string | null,"max_partner_weight": number | null,"min_partner_weight": number | null,"notes": string | null,"rounds_format": string | null,"scheduled_at": string,"status": Database["public"]['Enums']["session_status"],"venue_address": string | null,"venue_name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "training_sessions_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_matched_partner_id_fkey"
      columns: ["matched_partner_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "accept_session_request":
{ Args: { "request_id": string }; Returns: undefined
                           },
"can_request_session":
{ Args: { "p_session_id": string }; Returns: boolean
                           },
"can_review_session":
{ Args: { "p_reviewee_id": string,"p_session_id": string }; Returns: boolean
                           },
"cancel_training_session":
{ Args: { "session_id": string }; Returns: undefined
                           },
"create_training_session":
{ Args: { "discipline": Database["public"]['Enums']["discipline_slug"],"gym_id"?: string,"intensity": Database["public"]['Enums']["session_intensity"],"latitude"?: number,"longitude"?: number,"max_partner_weight"?: number,"min_partner_weight"?: number,"notes"?: string,"rounds_format"?: string,"scheduled_at": string }; Returns: string
                           },
"get_nearby_gyms":
{ Args: { "radius_meters"?: number,"user_lat": number,"user_lng": number }; Returns: {
              "address": string,"currency": string,"distance_meters": number,"drop_in_fee_cents": number,"id": string,"is_partner": boolean,"latitude": number,"longitude": number,"name": string
            }[]
                           },
"get_nearby_sessions":
{ Args: { "discipline"?: Database["public"]['Enums']["discipline_slug"],"intensity_filter"?: Database["public"]['Enums']["session_intensity"],"radius_meters"?: number,"user_lat": number,"user_lng": number,"user_weight"?: number,"weight_tolerance_kg"?: number }; Returns: {
              "creator_avatar_url": string,"creator_completed_sessions": number,"creator_control_rating": number,"creator_id": string,"creator_is_verified": boolean,"creator_name": string,"creator_weight_kg": number,"currency": string,"discipline_slug": Database["public"]['Enums']["discipline_slug"],"distance_meters": number,"drop_in_fee_cents": number,"gym_id": string,"id": string,"intensity": Database["public"]['Enums']["session_intensity"],"latitude": number,"longitude": number,"max_partner_weight": number,"min_partner_weight": number,"notes": string,"rounds_format": string,"scheduled_at": string,"venue_address": string,"venue_name": string
            }[]
                           },
"has_requested_session":
{ Args: { "p_session_id": string }; Returns: boolean
                           },
"is_session_creator":
{ Args: { "p_session_id": string }; Returns: boolean
                           },
"is_session_participant":
{ Args: { "p_session_id": string }; Returns: boolean
                           }
          }
          Enums: {
            "discipline_slug": "muay_thai"|"bjj_gi"|"bjj_nogi"|"boxing"|"running","request_status": "pending"|"accepted"|"declined"|"withdrawn","session_intensity": "technical_light"|"moderate"|"hard_sparring"|"drills_only","session_status": "open"|"matched"|"completed"|"cancelled","stance": "orthodox"|"southpaw"|"switch"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "discipline_slug": ["muay_thai", "bjj_gi", "bjj_nogi", "boxing", "running"],"request_status": ["pending", "accepted", "declined", "withdrawn"],"session_intensity": ["technical_light", "moderate", "hard_sparring", "drills_only"],"session_status": ["open", "matched", "completed", "cancelled"],"stance": ["orthodox", "southpaw", "switch"]
          }
        }
} as const
