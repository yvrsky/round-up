import type { Discipline, Intensity } from "@/types/models";

export type NearbySessionsParams = {
  latitude: number;
  longitude: number;
  radiusKm: number;
  discipline: Discipline | null;
  intensity: Intensity | null;
  weightToleranceKg: number | null;
  userWeight: number | null;
};

export const queryKeys = {
  location: ["location"] as const,
  profile: (userId: string) => ["profile", userId] as const,
  sessions: ["sessions"] as const,
  nearbySessions: (params: NearbySessionsParams) => ["sessions", "nearby", params] as const,
  mySessions: (userId: string) => ["sessions", "mine", userId] as const,
  session: (sessionId: string) => ["session", sessionId] as const,
  sessionRequests: (sessionId: string) => ["session", sessionId, "requests"] as const,
  sessionMessages: (sessionId: string) => ["session", sessionId, "messages"] as const,
  sessionMyReview: (sessionId: string, userId: string) => ["session", sessionId, "review", userId] as const,
  nearbyGyms: (latitude: number, longitude: number) => ["gyms", "nearby", latitude, longitude] as const,
};

/** Round coordinates so small GPS jitter doesn't create new cache entries (~100 m). */
export function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}
