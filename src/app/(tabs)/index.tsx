import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterModal } from "@/components/session/FilterModal";
import { SessionCard } from "@/components/session/SessionCard";
import { SessionMap } from "@/components/session/SessionMap";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useNearbySessions } from "@/hooks/useNearbySessions";
import { useMyProfile } from "@/hooks/useProfile";
import { BRAND_COLOR, DISCIPLINE_LABELS } from "@/lib/constants";
import { useActiveFilterCount, useFilterStore } from "@/store/useFilterStore";
import type { NearbySession } from "@/types/models";

type ViewMode = "list" | "map";

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <View className="flex-row rounded-xl bg-slate-200 p-1">
      {(["list", "map"] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === m }}
          accessibilityLabel={m === "list" ? "List view" : "Map view"}
          className={`flex-row items-center gap-1 rounded-lg px-3 py-1.5 ${mode === m ? "bg-white" : ""}`}
        >
          <Ionicons name={m === "list" ? "list" : "map-outline"} size={16} color="#0F172A" />
        </Pressable>
      ))}
    </View>
  );
}

export default function SessionBoardScreen() {
  const router = useRouter();
  const openSession = (id: string) => router.push({ pathname: "/session/[id]", params: { id } });
  const [mode, setMode] = useState<ViewMode>("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const profile = useMyProfile();
  const nearby = useNearbySessions();
  const activeFilters = useActiveFilterCount();
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const discipline = useFilterStore((s) => s.discipline);
  const resetFilters = useFilterStore((s) => s.reset);

  const sessions = nearby.data ?? [];
  const subtitle = `${discipline ? DISCIPLINE_LABELS[discipline] : "All disciplines"} · within ${radiusKm} km`;

  let body: React.ReactNode;
  if (nearby.isLocating || (nearby.isPending && nearby.fetchStatus !== "idle")) {
    body = <LoadingState label="Finding sessions near you…" />;
  } else if (nearby.isError) {
    body = <ErrorState error={nearby.error} onRetry={() => void nearby.refetch()} />;
  } else if (mode === "map" && nearby.location) {
    body = (
      <View className="flex-1">
        <SessionMap sessions={sessions} center={nearby.location} radiusKm={radiusKm} onSelect={openSession} />
      </View>
    );
  } else {
    body = (
      <FlashList<NearbySession>
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl refreshing={nearby.isRefetching} onRefresh={() => void nearby.refetch()} tintColor={BRAND_COLOR} />
        }
        renderItem={({ item }) => <SessionCard session={item} onPress={() => openSession(item.id)} />}
        ListEmptyComponent={
          <EmptyState
            title="No sessions nearby"
            body={activeFilters > 0 ? "Try widening your filters." : "Be the first: post a session and let partners come to you."}
            action={
              activeFilters > 0 ? (
                <Button title="Clear filters" variant="secondary" size="sm" onPress={resetFilters} />
              ) : (
                <Button title="Create a session" size="sm" onPress={() => router.push("/create")} />
              )
            }
          />
        }
      />
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-50">
      <View className="gap-3 border-b border-slate-200 bg-slate-50 px-4 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-ink">Session Board</Text>
            <Text className="text-sm text-slate-500">{subtitle}</Text>
          </View>
          <ViewToggle mode={mode} onChange={setMode} />
        </View>

        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}
          className="flex-row items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-3.5 py-2 active:bg-slate-100"
        >
          <Ionicons name="options-outline" size={16} color="#0F172A" />
          <Text className="text-sm font-medium text-ink">Filters</Text>
          {activeFilters > 0 ? (
            <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5">
              <Text className="text-xs font-bold text-white">{activeFilters}</Text>
            </View>
          ) : null}
        </Pressable>

        {nearby.location?.isFallback ? (
          <View className="flex-row items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
            <Ionicons name="location-outline" size={16} color="#B45309" />
            <Text className="flex-1 text-xs text-amber-800">
              {nearby.location.fallbackReason === "denied"
                ? "Location access is off, so we're showing sessions around Kyiv city centre."
                : "Couldn't get your location, so we're showing sessions around Kyiv city centre."}
            </Text>
          </View>
        ) : null}
      </View>

      {body}

      <FilterModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        userWeightKg={profile.data?.weight_kg ?? null}
      />
    </SafeAreaView>
  );
}
