import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import type { SessionMessage } from "@/types/models";

export type ChatMessage = SessionMessage & { pending?: boolean };

const MESSAGE_LIMIT = 200;

function isOptimistic(message: ChatMessage): boolean {
  return message.id.startsWith("optimistic-");
}

/**
 * Add a server-confirmed message to the list: skip if already present, and replace the matching
 * optimistic placeholder (same sender + content) so the user doesn't see their message twice.
 */
function mergeMessage(list: ChatMessage[] | undefined, incoming: SessionMessage): ChatMessage[] {
  const current = list ?? [];
  if (current.some((m) => m.id === incoming.id)) return current;
  const placeholderIndex = current.findIndex(
    (m) => isOptimistic(m) && m.sender_id === incoming.sender_id && m.content === incoming.content
  );
  if (placeholderIndex === -1) return [...current, incoming];
  const next = [...current];
  next[placeholderIndex] = incoming;
  return next;
}

/** Chat history + live inserts via Supabase Realtime. Only enable for session participants. */
export function useSessionChat(sessionId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const key = queryKeys.sessionMessages(sessionId);

  const query = useQuery({
    queryKey: key,
    enabled,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("session_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_LIMIT);
      if (error) throw error;
      return data.reverse();
    },
  });

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`session-chat:${sessionId}`)
      .on<SessionMessage>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          queryClient.setQueryData<ChatMessage[]>(key, (old) => mergeMessage(old, payload.new));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // `key` is derived from sessionId; listing it would resubscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId, queryClient]);

  return query;
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const key = queryKeys.sessionMessages(sessionId);

  return useMutation({
    mutationFn: async ({ content, isPreset }: { content: string; isPreset: boolean }) => {
      const { data, error } = await supabase
        .from("session_messages")
        .insert({ session_id: sessionId, content, is_preset: isPreset })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ content, isPreset }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        session_id: sessionId,
        sender_id: session?.user.id ?? "",
        content,
        is_preset: isPreset,
        created_at: new Date().toISOString(),
        pending: true,
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), optimistic]);
      return { optimisticId };
    },
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(key, (old) => mergeMessage(old, message));
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData<ChatMessage[]>(key, (old) => (old ?? []).filter((m) => m.id !== context?.optimisticId));
    },
  });
}
