import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ControlRatingStars } from "@/components/profile/ControlRatingStars";
import { DisciplinePill } from "@/components/profile/DisciplinePill";
import { GearList, parseEquipment } from "@/components/profile/GearChecklist";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/useProfile";
import { STANCE_LABELS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

function experienceLabel(months: number): string {
  if (months < 12) return `${months} mo`;
  const years = Math.round(months / 12);
  return `${years} yr${years > 1 ? "s" : ""}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 rounded-xl bg-slate-50 py-3">
      <Text className="text-lg font-bold text-ink">{value}</Text>
      <Text className="text-xs text-slate-500">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const profile = useMyProfile();
  const queryClient = useQueryClient();

  if (profile.isPending) return <LoadingState />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;

  const p = profile.data;

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="gap-4 p-5 pb-12">
        <View className="gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-3xl font-bold text-ink">{p.full_name ?? "Athlete"}</Text>
            {p.is_verified ? <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" /> : null}
          </View>
          <Text className="text-sm text-slate-500">{session?.user.email}</Text>
        </View>

        <Card>
          <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">Control Rating</Text>
          <ControlRatingStars rating={p.control_rating} count={p.completed_sessions_count} size={22} />
          <Text className="text-sm text-slate-500">
            Peer-reviewed after each session for control and punctuality, not wins.
          </Text>
          <View className="flex-row gap-2">
            <Stat label="Weight" value={p.weight_kg != null ? `${p.weight_kg} kg` : "–"} />
            <Stat label="Height" value={p.height_cm != null ? `${p.height_cm} cm` : "–"} />
            <Stat label="Stance" value={p.stance ? STANCE_LABELS[p.stance] : "–"} />
          </View>
        </Card>

        <Card>
          <Text className="text-lg font-bold text-ink">Disciplines</Text>
          {p.disciplines.length === 0 ? (
            <Text className="text-sm text-slate-500">No disciplines yet.</Text>
          ) : (
            p.disciplines.map((d) => (
              <View key={d.id} className="gap-2 border-t border-slate-100 pt-3">
                <DisciplinePill discipline={d.discipline_slug} detail={d.rank_label} />
                <Text className="text-sm text-slate-500">{experienceLabel(d.experience_months)} experience</Text>
                <GearList equipment={parseEquipment(d.equipment)} />
              </View>
            ))
          )}
        </Card>

        <Button title="Edit profile" variant="secondary" onPress={() => router.push("/onboarding")} />
        <Button title="Sign out" variant="ghost" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}
