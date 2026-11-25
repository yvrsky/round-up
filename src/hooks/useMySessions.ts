import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import type { RequestStatus, SessionDetails } from "@/types/models";

export type MySessionRole = "creator" | "partner" | "applicant";

export type MySessionItem = {
  session: SessionDetails;
  role: MySessionRole;
  /** The viewer's own request status, when they applied to someone else's session. */
  myRequestStatus: RequestStatus | null;
  /** Pending requests waiting on the viewer, for sessions they created. */
  pendingRequestCount: number;
  /** Matched/completed, session time has passed, and the viewer hasn't reviewed their partner. */
  needsReview: boolean;
};

export type MySessionSections = {
  actionNeeded: MySessionItem[];
  upcoming: MySessionItem[];
  past: MySessionItem[];
};

async function fetchMySessions(userId: string): Promise<MySessionSections> {
  const { data: myRequests, error: requestsError } = await supabase
    .from("session_requests")
    .select("session_id, status")
    .eq("applicant_id", userId);
  if (requestsError) throw requestsError;

  const requestedIds = myRequests.map((r) => r.session_id);
  const orFilter = [
    `creator_id.eq.${userId}`,
    `matched_partner_id.eq.${userId}`,
    requestedIds.length > 0 ? `id.in.(${requestedIds.join(",")})` : null,
  ]
    .filter(Boolean)
    .join(",");

  const { data: sessions, error: sessionsError } = await supabase
    .from("session_details")
    .select("*")
    .or(orFilter)
    .order("scheduled_at", { ascending: true });
  if (sessionsError) throw sessionsError;

  const createdOpenIds = sessions.filter((s) => s.creator_id === userId && s.status === "open").map((s) => s.id);
  const reviewCandidateIds = sessions
    .filter((s) => (s.status === "matched" || s.status === "completed") && new Date(s.scheduled_at) < new Date())
    .map((s) => s.id);

  const [pendingResult, reviewsResult] = await Promise.all([
    createdOpenIds.length > 0
      ? supabase.from("session_requests").select("session_id").eq("status", "pending").in("session_id", createdOpenIds)
      : Promise.resolve({ data: [] as { session_id: string }[], error: null }),
    reviewCandidateIds.length > 0
      ? supabase.from("session_reviews").select("session_id").eq("reviewer_id", userId).in("session_id", reviewCandidateIds)
      : Promise.resolve({ data: [] as { session_id: string }[], error: null }),
  ]);
  if (pendingResult.error) throw pendingResult.error;
  if (reviewsResult.error) throw reviewsResult.error;

  const pendingCounts = new Map<string, number>();
  for (const r of pendingResult.data) pendingCounts.set(r.session_id, (pendingCounts.get(r.session_id) ?? 0) + 1);
  const reviewed = new Set(reviewsResult.data.map((r) => r.session_id));
  const requestStatus = new Map(myRequests.map((r) => [r.session_id, r.status]));
  const now = Date.now();

  const sections: MySessionSections = { actionNeeded: [], upcoming: [], past: [] };

  for (const session of sessions) {
    const role: MySessionRole =
      session.creator_id === userId ? "creator" : session.matched_partner_id === userId ? "partner" : "applicant";
    const myRequestStatus = requestStatus.get(session.id) ?? null;
    const isPast = new Date(session.scheduled_at).getTime() < now;
    const isMatchedPair = role !== "applicant" && (session.status === "matched" || session.status === "completed");
    const item: MySessionItem = {
      session,
      role,
      myRequestStatus,
      pendingRequestCount: pendingCounts.get(session.id) ?? 0,
      needsReview: isMatchedPair && isPast && !reviewed.has(session.id),
    };

    const inactive =
      session.status === "cancelled" ||
      session.status === "completed" ||
      myRequestStatus === "declined" ||
      myRequestStatus === "withdrawn";

    if (item.needsReview || (!isPast && session.status === "open" && item.pendingRequestCount > 0)) {
      sections.actionNeeded.push(item);
    } else if (!isPast && !inactive) {
      sections.upcoming.push(item);
    } else {
      sections.past.push(item);
    }
  }

  sections.past.reverse(); // most recent first
  return sections;
}

export function useMySessions() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: queryKeys.mySessions(userId ?? "anonymous"),
    queryFn: () => fetchMySessions(userId as string),
    enabled: Boolean(userId),
  });
}
