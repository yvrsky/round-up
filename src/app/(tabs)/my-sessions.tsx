import { useRouter } from "expo-router";
import { RefreshControl, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SessionCard } from "@/components/session/SessionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useMySessions, type MySessionItem } from "@/hooks/useMySessions";
import { BRAND_COLOR } from "@/lib/constants";

function ItemFooter({ item }: { item: MySessionItem }) {
  const badges: { label: string; tone: React.ComponentProps<typeof Badge>["tone"] }[] = [];

  if (item.needsReview) badges.push({ label: "Leave a review", tone: "brand" });
  if (item.pendingRequestCount > 0)
    badges.push({ label: `${item.pendingRequestCount} request${item.pendingRequestCount > 1 ? "s" : ""}`, tone: "brand" });

  if (item.role === "creator") badges.push({ label: "Hosting", tone: "neutral" });
  else if (item.role === "partner") badges.push({ label: "Matched", tone: "success" });
  else if (item.myRequestStatus === "pending") badges.push({ label: "Awaiting reply", tone: "info" });
  else if (item.myRequestStatus === "declined") badges.push({ label: "Not selected", tone: "neutral" });
  else if (item.myRequestStatus === "withdrawn") badges.push({ label: "Withdrawn", tone: "neutral" });

  return (
    <View className="flex-row flex-wrap gap-2">
      {badges.map((b) => (
        <Badge key={b.label} label={b.label} tone={b.tone} />
      ))}
    </View>
  );
}

export default function MySessionsScreen() {
  const router = useRouter();
  const mySessions = useMySessions();

  if (mySessions.isPending) return <LoadingState />;

  const data = mySessions.data;
  const sections = data
    ? [
        { title: "Needs your attention", data: data.actionNeeded },
        { title: "Upcoming", data: data.upcoming },
        { title: "Past", data: data.past },
      ].filter((s) => s.data.length > 0)
    : [];

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-50">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.session.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={mySessions.isRefetching} onRefresh={() => void mySessions.refetch()} tintColor={BRAND_COLOR} />
        }
        ListHeaderComponent={<Text className="text-3xl font-bold text-ink">My Sessions</Text>}
        renderSectionHeader={({ section }) => (
          <Text className="pt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <SessionCard
            session={item.session}
            showStatus
            onPress={() => router.push({ pathname: "/session/[id]", params: { id: item.session.id } })}
            footer={<ItemFooter item={item} />}
          />
        )}
        ListEmptyComponent={
          mySessions.isError ? (
            <ErrorState error={mySessions.error} onRetry={() => void mySessions.refetch()} />
          ) : (
            <EmptyState
              title="Nothing scheduled yet"
              body="Sessions you post or request to join show up here."
              action={<Button title="Browse the board" size="sm" onPress={() => router.push("/")} />}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
