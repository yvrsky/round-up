import type { Database } from "./database.types";

type PublicSchema = Database["public"];
type Tables = PublicSchema["Tables"];

/** Mark keys of T as possibly null (supabase typegen marks every RETURNS TABLE column non-null). */
type NullableKeys<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] | null };

export type Discipline = PublicSchema["Enums"]["discipline_slug"];
export type Intensity = PublicSchema["Enums"]["session_intensity"];
export type Stance = PublicSchema["Enums"]["stance"];
export type SessionStatus = PublicSchema["Enums"]["session_status"];
export type RequestStatus = PublicSchema["Enums"]["request_status"];

export type UserDiscipline = Tables["user_disciplines"]["Row"];
export type SessionRequest = Tables["session_requests"]["Row"];
export type SessionMessage = Tables["session_messages"]["Row"];
export type SessionReview = Tables["session_reviews"]["Row"];
export type SessionDetails = PublicSchema["Views"]["session_details"]["Row"];

export type NearbySession = NullableKeys<
  PublicSchema["Functions"]["get_nearby_sessions"]["Returns"][number],
  | "gym_id"
  | "venue_name"
  | "venue_address"
  | "drop_in_fee_cents"
  | "currency"
  | "rounds_format"
  | "min_partner_weight"
  | "max_partner_weight"
  | "notes"
  | "creator_name"
  | "creator_avatar_url"
  | "creator_weight_kg"
>;

export type NearbyGym = NullableKeys<PublicSchema["Functions"]["get_nearby_gyms"]["Returns"][number], "drop_in_fee_cents">;

/**
 * Columns of `users` the client is allowed to read. `email` and `base_location` are not granted
 * to API roles — selecting them (or `*`) fails with a permission error.
 */
export const PUBLIC_PROFILE_COLUMNS =
  "id, full_name, avatar_url, weight_kg, height_cm, stance, home_gym_id, control_rating, completed_sessions_count, is_verified, onboarding_completed_at, created_at" as const;

export type PublicProfile = Pick<
  Tables["users"]["Row"],
  | "id"
  | "full_name"
  | "avatar_url"
  | "weight_kg"
  | "height_cm"
  | "stance"
  | "home_gym_id"
  | "control_rating"
  | "completed_sessions_count"
  | "is_verified"
  | "onboarding_completed_at"
  | "created_at"
>;

/** Session fields shared by the feed RPC and the details view, for components that render either. */
export type SessionSummary = Pick<
  SessionDetails,
  | "id"
  | "discipline_slug"
  | "intensity"
  | "scheduled_at"
  | "rounds_format"
  | "venue_name"
  | "min_partner_weight"
  | "max_partner_weight"
  | "creator_name"
  | "creator_control_rating"
  | "creator_completed_sessions"
  | "creator_is_verified"
> & { distance_meters?: number | null; status?: SessionStatus };
