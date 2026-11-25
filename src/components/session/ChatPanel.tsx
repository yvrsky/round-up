import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { ErrorState } from "@/components/ui/StateViews";
import { useSendMessage, useSessionChat, type ChatMessage } from "@/hooks/useSessionChat";
import { BRAND_COLOR, CHAT_PRESETS } from "@/lib/constants";
import { notify } from "@/lib/dialogs";
import { errorMessage } from "@/lib/format";

type ChatPanelProps = {
  sessionId: string;
  currentUserId: string;
  /** user id → display name, for everyone who can be in this chat. */
  names: ReadonlyMap<string, string>;
  /** Hide the composer (e.g. cancelled/completed sessions) but keep history readable. */
  readOnly?: boolean;
};

function MessageBubble({ message, mine, senderName }: { message: ChatMessage; mine: boolean; senderName: string }) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <View className={`max-w-[80%] gap-0.5 ${mine ? "self-end items-end" : "self-start items-start"}`}>
      {!mine ? <Text className="px-1 text-xs font-medium text-slate-500">{senderName}</Text> : null}
      <View
        className={`rounded-2xl px-3.5 py-2 ${mine ? "bg-brand" : "border border-slate-200 bg-white"} ${
          message.is_preset ? "border-dashed" : ""
        } ${message.pending ? "opacity-60" : ""}`}
      >
        <Text className={`text-base ${mine ? "text-white" : "text-ink"}`}>{message.content}</Text>
      </View>
      <Text className="px-1 text-[10px] text-slate-400">{message.pending ? "Sending…" : time}</Text>
    </View>
  );
}

/** Realtime coordination chat with one-tap preset messages. */
export function ChatPanel({ sessionId, currentUserId, names, readOnly = false }: ChatPanelProps) {
  const chat = useSessionChat(sessionId, true);
  const send = useSendMessage(sessionId);
  const [draft, setDraft] = useState("");

  function submit(content: string, isPreset: boolean) {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!isPreset) setDraft("");
    send.mutate(
      { content: trimmed, isPreset },
      {
        onError: (error) => {
          if (!isPreset) setDraft(trimmed);
          notify("Message not sent", errorMessage(error));
        },
      }
    );
  }

  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-ink">Coordination chat</Text>

      <View className="min-h-[120px] gap-3 rounded-2xl bg-slate-100 p-3">
        {chat.isPending ? (
          <ActivityIndicator color={BRAND_COLOR} />
        ) : chat.isError ? (
          <ErrorState error={chat.error} onRetry={() => void chat.refetch()} />
        ) : chat.data.length === 0 ? (
          <Text className="py-6 text-center text-sm text-slate-500">
            No messages yet. Sort out gear, timing, and drop-in fees here.
          </Text>
        ) : (
          chat.data.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              mine={m.sender_id === currentUserId}
              senderName={names.get(m.sender_id) ?? "Athlete"}
            />
          ))
        )}
      </View>

      {readOnly ? null : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {CHAT_PRESETS.map((preset) => (
              <Chip key={preset} label={preset} selected={false} onPress={() => submit(preset, true)} />
            ))}
          </ScrollView>

          <View className="flex-row items-end gap-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={1000}
              className="max-h-28 min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-ink"
              accessibilityLabel="Message"
            />
            <Pressable
              onPress={() => submit(draft, false)}
              disabled={!draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              className={`h-11 w-11 items-center justify-center rounded-full bg-brand ${draft.trim() ? "" : "opacity-40"}`}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
