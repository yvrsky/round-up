import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import type { Discipline, Intensity, SessionDetails } from "@/types/models";

const APPLICANT_COLUMNS =
  "id, session_id, applicant_id, message, status, created_at, applicant:users!session_requests_applicant_id_fkey(id, full_name, avatar_url, weight_kg, height_cm, stance, control_rating, completed_sessions_count, is_verified)" as const;

async function querySessionRequests(sessionId: string) {
  const { data, error } = await supabase
    .from("session_requests")
    .select(APPLICANT_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at");
  if (error) throw error;
  return data;
}

type FetchedRequest = Awaited<ReturnType<typeof querySessionRequests>>[number];

/** `applicant` is null only on the optimistic row inserted before the server responds. */
export type SessionRequestWithApplicant = Omit<FetchedRequest, "applicant"> & {
  applicant: FetchedRequest["applicant"] | null;
};

const fetchSessionRequests = (sessionId: string): Promise<SessionRequestWithApplicant[]> =>
  querySessionRequests(sessionId);

export function useSessionDetails(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: async (): Promise<SessionDetails | null> => {
      const { data, error } = await supabase.from("session_details").select("*").eq("id", sessionId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Creators get every request for the session; anyone else gets only their own (RLS). */
export function useSessionRequests(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionRequests(sessionId),
    queryFn: () => fetchSessionRequests(sessionId),
  });
}

function useInvalidateSession(sessionId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
    ]);
}

/** Request to join, shown immediately as "pending" and rolled back if the insert is rejected. */
export function useRequestToJoin(sessionId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const invalidate = useInvalidateSession(sessionId);
  const key = queryKeys.sessionRequests(sessionId);

  return useMutation({
    mutationFn: async (message: string | null) => {
      const { error } = await supabase.from("session_requests").insert({ session_id: sessionId, message });
      if (error) throw error;
    },
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SessionRequestWithApplicant[]>(key);
      const optimistic: SessionRequestWithApplicant = {
        id: `optimistic-${Date.now()}`,
        session_id: sessionId,
        applicant_id: session?.user.id ?? "",
        message,
        status: "pending",
        created_at: new Date().toISOString(),
        applicant: null,
      };
      queryClient.setQueryData<SessionRequestWithApplicant[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (_error, _message, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      await invalidate();
    },
  });
}

export function useWithdrawRequest(sessionId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSession(sessionId);
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from("session_requests").update({ status: "withdrawn" }).eq("id", requestId);
      if (error) throw error;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionRequests(sessionId) });
      await invalidate();
    },
  });
}

export function useAcceptRequest(sessionId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSession(sessionId);
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("accept_session_request", { request_id: requestId });
      if (error) throw error;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionRequests(sessionId) });
      await invalidate();
    },
  });
}

export function useCancelSession(sessionId: string) {
  const invalidate = useInvalidateSession(sessionId);
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("cancel_training_session", { session_id: sessionId });
      if (error) throw error;
    },
    onSettled: invalidate,
  });
}

export type CreateSessionInput = {
  discipline: Discipline;
  intensity: Intensity;
  scheduledAt: Date;
  venue: { kind: "gym"; gymId: string } | { kind: "pin"; latitude: number; longitude: number };
  roundsFormat: string | null;
  minPartnerWeight: number | null;
  maxPartnerWeight: number | null;
  notes: string | null;
};

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput): Promise<string> => {
      const { data, error } = await supabase.rpc("create_training_session", {
        discipline: input.discipline,
        intensity: input.intensity,
        scheduled_at: input.scheduledAt.toISOString(),
        gym_id: input.venue.kind === "gym" ? input.venue.gymId : undefined,
        latitude: input.venue.kind === "pin" ? input.venue.latitude : undefined,
        longitude: input.venue.kind === "pin" ? input.venue.longitude : undefined,
        rounds_format: input.roundsFormat ?? undefined,
        min_partner_weight: input.minPartnerWeight ?? undefined,
        max_partner_weight: input.maxPartnerWeight ?? undefined,
        notes: input.notes ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}
