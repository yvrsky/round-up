import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";

/** Whether the signed-in user has already reviewed their partner for this session. */
export function useHasReviewed(sessionId: string, enabled: boolean) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "anonymous";
  return useQuery({
    queryKey: queryKeys.sessionMyReview(sessionId, userId),
    enabled: enabled && Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_reviews")
        .select("id")
        .eq("session_id", sessionId)
        .eq("reviewer_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
  });
}

export type ReviewInput = {
  revieweeId: string;
  controlScore: number;
  punctualityScore: number;
  comment: string | null;
};

export function useSubmitReview(sessionId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const { error } = await supabase.from("session_reviews").insert({
        session_id: sessionId,
        reviewee_id: input.revieweeId,
        control_score: input.controlScore,
        punctuality_score: input.punctualityScore,
        comment: input.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (session) queryClient.setQueryData(queryKeys.sessionMyReview(sessionId, session.user.id), true);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
      ]),
  });
}
