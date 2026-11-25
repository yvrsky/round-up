import { Pressable, ScrollView, Text, View } from "react-native";

import { DISCIPLINE_LABELS } from "@/lib/constants";
import { formatDistance, formatSessionTime } from "@/lib/format";

import type { SessionMapProps } from "./SessionMap";

/**
 * react-native-maps has no web implementation, so on web the "map" view is a compact venue list.
 */
export function SessionMap({ sessions, onSelect }: SessionMapProps) {
  return (
    <ScrollView contentContainerClassName="gap-2 p-4">
      <Text className="text-sm text-slate-500">The map view is available in the mobile app. Venues near you:</Text>
      {sessions.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => onSelect(s.id)}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-3 active:bg-slate-50"
        >
          <View className="flex-1">
            <Text className="font-semibold text-ink">{s.venue_name ?? "Custom location"}</Text>
            <Text className="text-sm text-slate-500">
              {DISCIPLINE_LABELS[s.discipline_slug]} · {formatSessionTime(s.scheduled_at)}
            </Text>
          </View>
          <Text className="text-sm text-slate-500">{formatDistance(s.distance_meters)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
