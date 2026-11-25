import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { ControlRatingStars } from "@/components/profile/ControlRatingStars";
import { DisciplinePill } from "@/components/profile/DisciplinePill";
import { IntensityBadge, StatusBadge } from "@/components/session/IntensityBadge";
import { PressableCard } from "@/components/ui/Card";
import { formatDistance, formatSessionTime, formatWeightRange } from "@/lib/format";
import type { SessionSummary } from "@/types/models";

type SessionCardProps = {
  session: SessionSummary;
  onPress: () => void;
  /** Extra badges/labels rendered under the header (e.g. "2 requests"). */
  footer?: React.ReactNode;
  showStatus?: boolean;
};

export function SessionCard({ session, onPress, footer, showStatus = false }: SessionCardProps) {
  const weight = formatWeightRange(session.min_partner_weight, session.max_partner_weight);
  const venue = session.venue_name ?? "Custom location";

  return (
    <PressableCard onPress={onPress} accessibilityLabel={`Session at ${venue}, ${formatSessionTime(session.scheduled_at)}`}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-1.5">
          <DisciplinePill discipline={session.discipline_slug} />
          <Text className="text-lg font-bold text-ink">{formatSessionTime(session.scheduled_at)}</Text>
        </View>
        {session.distance_meters != null ? (
          <Text className="text-sm font-semibold text-slate-500">{formatDistance(session.distance_meters)}</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1.5">
        <Ionicons name="location-outline" size={14} color="#64748B" />
        <Text className="flex-1 text-sm text-slate-600" numberOfLines={1}>
          {venue}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <IntensityBadge intensity={session.intensity} />
        {showStatus && session.status ? <StatusBadge status={session.status} /> : null}
        {session.rounds_format ? <Text className="text-xs text-slate-500">{session.rounds_format}</Text> : null}
        {weight ? <Text className="text-xs text-slate-500">· {weight}</Text> : null}
      </View>

      <View className="flex-row items-center justify-between border-t border-slate-100 pt-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-medium text-ink">{session.creator_name ?? "Athlete"}</Text>
          {session.creator_is_verified ? <Ionicons name="checkmark-circle" size={14} color="#0EA5E9" /> : null}
        </View>
        <ControlRatingStars rating={session.creator_control_rating} count={session.creator_completed_sessions} />
      </View>

      {footer}
    </PressableCard>
  );
}
