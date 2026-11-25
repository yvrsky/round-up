import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { ControlRatingStars } from "@/components/profile/ControlRatingStars";
import { DisciplinePill } from "@/components/profile/DisciplinePill";
import { ChatPanel } from "@/components/session/ChatPanel";
import { IntensityBadge, StatusBadge } from "@/components/session/IntensityBadge";
import { ReviewModal } from "@/components/session/ReviewModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useNow } from "@/hooks/useNow";
import { useMyProfile } from "@/hooks/useProfile";
import { useHasReviewed } from "@/hooks/useReviews";
import {
  useAcceptRequest,
  useCancelSession,
  useRequestToJoin,
  useSessionDetails,
  useSessionRequests,
  useWithdrawRequest,
  type SessionRequestWithApplicant,
} from "@/hooks/useSession";
import { DISCIPLINE_LABELS, STANCE_LABELS } from "@/lib/constants";
import { confirm, notify } from "@/lib/dialogs";
import { errorMessage, formatFee, formatSessionTime, formatWeightRange } from "@/lib/format";
import type { SessionDetails } from "@/types/models";

function SpecRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <Ionicons name={icon} size={18} color="#64748B" style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</Text>
        <Text className="text-base text-ink">{value}</Text>
      </View>
    </View>
  );
}

function openInMaps(session: SessionDetails) {
  if (session.latitude == null || session.longitude == null) return;
  const query = `${session.latitude},${session.longitude}`;
  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?ll=${query}&q=${encodeURIComponent(session.venue_name ?? "Meeting point")}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
  void Linking.openURL(url);
}

function ApplicantRow({
  request,
  canAccept,
  onAccept,
  accepting,
}: {
  request: SessionRequestWithApplicant;
  canAccept: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const a = request.applicant;
  const stats = [
    a?.weight_kg != null ? `${a.weight_kg} kg` : null,
    a?.height_cm != null ? `${a.height_cm} cm` : null,
    a?.stance ? STANCE_LABELS[a.stance] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View className="gap-2 border-t border-slate-100 pt-3">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-1">
            <Text className="text-base font-semibold text-ink">{a?.full_name ?? "Athlete"}</Text>
            {a?.is_verified ? <Ionicons name="checkmark-circle" size={14} color="#0EA5E9" /> : null}
          </View>
          {stats ? <Text className="text-sm text-slate-500">{stats}</Text> : null}
          {a ? <ControlRatingStars rating={a.control_rating} count={a.completed_sessions_count} /> : null}
        </View>
        {request.status === "pending" && canAccept ? (
          <Button title="Accept" size="sm" onPress={onAccept} loading={accepting} />
        ) : (
          <Badge
            label={request.status[0].toUpperCase() + request.status.slice(1)}
            tone={request.status === "accepted" ? "success" : request.status === "pending" ? "info" : "neutral"}
          />
        )}
      </View>
      {request.message ? <Text className="text-sm italic text-slate-600">“{request.message}”</Text> : null}
    </View>
  );
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session: auth } = useAuth();
  const me = auth?.user.id ?? "";
  const profile = useMyProfile();

  const details = useSessionDetails(id);
  const requests = useSessionRequests(id);
  const requestToJoin = useRequestToJoin(id);
  const withdraw = useWithdrawRequest(id);
  const accept = useAcceptRequest(id);
  const cancel = useCancelSession(id);

  const [joinMessage, setJoinMessage] = useState("");
  const [reviewRequested, setReviewRequested] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const now = useNow();

  const s = details.data;
  const isCreator = s?.creator_id === me;
  const isPartner = s?.matched_partner_id === me;
  const myRequest = requests.data?.find((r) => r.applicant_id === me) ?? null;
  const isParticipant =
    isCreator || isPartner || myRequest?.status === "pending" || myRequest?.status === "accepted";
  const isPast = s ? new Date(s.scheduled_at).getTime() < now : false;
  const isMatchedPair = (isCreator || isPartner) && (s?.status === "matched" || s?.status === "completed");
  const canReview = Boolean(isMatchedPair && isPast);
  const hasReviewed = useHasReviewed(id, canReview);

  const acceptedRequest = requests.data?.find((r) => r.status === "accepted");
  const partnerId = isCreator ? s?.matched_partner_id ?? null : s?.creator_id ?? null;
  const partnerName = isCreator ? acceptedRequest?.applicant?.full_name ?? "your partner" : s?.creator_name ?? "your partner";

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (s) map.set(s.creator_id, s.creator_name ?? "Creator");
    for (const r of requests.data ?? []) if (r.applicant?.full_name) map.set(r.applicant_id, r.applicant.full_name);
    if (profile.data?.full_name) map.set(me, profile.data.full_name);
    return map;
  }, [s, requests.data, profile.data, me]);

  // The review sheet opens by itself the first time a reviewable session is viewed (until dismissed),
  // and on demand from the "Review …" button.
  const reviewOpen = reviewRequested || (canReview && hasReviewed.data === false && !reviewDismissed);
  const closeReview = () => {
    setReviewRequested(false);
    setReviewDismissed(true);
  };

  if (details.isPending) return <LoadingState />;
  if (details.isError) return <ErrorState error={details.error} onRetry={() => void details.refetch()} />;
  if (!s) {
    return <EmptyState title="Session not found" body="It may have been cancelled or is no longer visible to you." />;
  }

  const myWeight = profile.data?.weight_kg ?? null;
  const fitsWeight =
    myWeight == null
      ? s.min_partner_weight == null && s.max_partner_weight == null
      : (s.min_partner_weight == null || myWeight >= s.min_partner_weight) &&
        (s.max_partner_weight == null || myWeight <= s.max_partner_weight);
  const weightRange = formatWeightRange(s.min_partner_weight, s.max_partner_weight);
  const fee = formatFee(s.drop_in_fee_cents, s.currency);
  const chatReadOnly = s.status === "cancelled" || s.status === "completed";

  async function handleCancel() {
    const ok = await confirm(
      "Cancel this session?",
      "Pending requests will be declined and your partner (if any) will see it as cancelled.",
      "Cancel session",
      true
    );
    if (ok) cancel.mutate(undefined, { onError: (e) => notify("Couldn't cancel", errorMessage(e)) });
  }

  async function handleAccept(request: SessionRequestWithApplicant) {
    const ok = await confirm(
      `Train with ${request.applicant?.full_name ?? "this athlete"}?`,
      "All other pending requests will be declined.",
      "Accept"
    );
    if (ok) accept.mutate(request.id, { onError: (e) => notify("Couldn't accept", errorMessage(e)) });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      className="flex-1 bg-slate-50"
    >
      <Stack.Screen options={{ title: DISCIPLINE_LABELS[s.discipline_slug] }} />
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
        // iOS 26+ headers are transparent (Liquid Glass); inset content below them.
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <DisciplinePill discipline={s.discipline_slug} />
            <IntensityBadge intensity={s.intensity} />
            <StatusBadge status={s.status} />
          </View>
          <Text className="text-2xl font-bold text-ink">{formatSessionTime(s.scheduled_at)}</Text>
        </View>

        <Card>
          <SpecRow icon="location-outline" label="Venue" value={[s.venue_name ?? "Custom meeting point", s.venue_address].filter(Boolean).join("\n")} />
          {s.latitude != null ? (
            <Button title="Open in maps" variant="ghost" size="sm" className="self-start" onPress={() => openInMaps(s)} />
          ) : null}
          {s.rounds_format ? <SpecRow icon="timer-outline" label="Format" value={s.rounds_format} /> : null}
          <SpecRow icon="barbell-outline" label="Partner weight" value={weightRange ?? "Any"} />
          {fee ? <SpecRow icon="cash-outline" label="Drop-in fee" value={fee} /> : null}
          {s.notes ? <SpecRow icon="document-text-outline" label="Notes" value={s.notes} /> : null}
        </Card>

        <Card>
          <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">Posted by</Text>
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-lg font-semibold text-ink">{isCreator ? "You" : s.creator_name ?? "Athlete"}</Text>
                {s.creator_is_verified ? <Ionicons name="checkmark-circle" size={16} color="#0EA5E9" /> : null}
              </View>
              <Text className="text-sm text-slate-500">
                {[s.creator_weight_kg != null ? `${s.creator_weight_kg} kg` : null, `${s.creator_completed_sessions} sessions`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            <ControlRatingStars rating={s.creator_control_rating} count={s.creator_completed_sessions} size={16} />
          </View>
        </Card>

        {/* Creator: manage requests */}
        {isCreator ? (
          <Card>
            <Text className="text-lg font-bold text-ink">
              {s.status === "open" ? "Requests" : s.status === "matched" || s.status === "completed" ? "Your partner" : "Requests"}
            </Text>
            {requests.isPending ? (
              <LoadingState />
            ) : requests.isError ? (
              <ErrorState error={requests.error} onRetry={() => void requests.refetch()} />
            ) : (
              (() => {
                const visible = (requests.data ?? []).filter((r) =>
                  s.status === "open" ? r.status === "pending" : r.status === "accepted"
                );
                return visible.length === 0 ? (
                  <Text className="text-sm text-slate-500">
                    {s.status === "open" ? "No requests yet. Athletes nearby will see your session on the board." : "No partner."}
                  </Text>
                ) : (
                  visible.map((r) => (
                    <ApplicantRow
                      key={r.id}
                      request={r}
                      canAccept={s.status === "open"}
                      onAccept={() => void handleAccept(r)}
                      accepting={accept.isPending && accept.variables === r.id}
                    />
                  ))
                );
              })()
            )}
            {(s.status === "open" || s.status === "matched") && !isPast ? (
              <Button title="Cancel session" variant="danger" size="sm" onPress={() => void handleCancel()} loading={cancel.isPending} />
            ) : null}
          </Card>
        ) : null}

        {/* Visitor / applicant actions */}
        {!isCreator ? (
          <Card>
            {myRequest?.status === "pending" ? (
              <>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color="#0369A1" />
                  <Text className="flex-1 text-base text-ink">Request sent. Waiting for {s.creator_name ?? "the creator"}.</Text>
                </View>
                <Button
                  title="Withdraw request"
                  variant="secondary"
                  size="sm"
                  disabled={myRequest.id.startsWith("optimistic-")}
                  loading={withdraw.isPending}
                  onPress={() => withdraw.mutate(myRequest.id, { onError: (e) => notify("Couldn't withdraw", errorMessage(e)) })}
                />
              </>
            ) : myRequest?.status === "accepted" || isPartner ? (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text className="flex-1 text-base font-semibold text-ink">You&apos;re matched. See you there!</Text>
              </View>
            ) : myRequest?.status === "declined" ? (
              <Text className="text-base text-slate-600">{s.creator_name ?? "The creator"} picked another partner for this one.</Text>
            ) : myRequest?.status === "withdrawn" ? (
              <Text className="text-base text-slate-600">You withdrew your request.</Text>
            ) : s.status !== "open" || isPast ? (
              <Text className="text-base text-slate-600">This session is no longer taking requests.</Text>
            ) : !fitsWeight ? (
              <Text className="text-base text-slate-600">
                Your weight ({myWeight ?? "not set"}
                {myWeight != null ? " kg" : ""}) is outside this session&apos;s partner range ({weightRange}).
              </Text>
            ) : (
              <>
                <Input
                  label="Message to the creator (optional)"
                  value={joinMessage}
                  onChangeText={setJoinMessage}
                  placeholder="Experience, what you want to work on…"
                  maxLength={500}
                  multiline
                  className="h-20 py-3"
                  textAlignVertical="top"
                />
                <Button
                  title="Request to join"
                  loading={requestToJoin.isPending}
                  onPress={() =>
                    requestToJoin.mutate(joinMessage.trim() || null, {
                      onSuccess: () => setJoinMessage(""),
                      onError: (e) => notify("Request not sent", errorMessage(e)),
                    })
                  }
                />
              </>
            )}
          </Card>
        ) : null}

        {/* Post-session review */}
        {canReview && partnerId ? (
          hasReviewed.data ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-emerald-50 p-3">
              <Ionicons name="star" size={16} color="#059669" />
              <Text className="text-sm text-emerald-800">Thanks, your review of {partnerName} is in.</Text>
            </View>
          ) : hasReviewed.data === false ? (
            <Button title={`Review ${partnerName}`} onPress={() => setReviewRequested(true)} />
          ) : null
        ) : null}

        {isParticipant ? (
          <Card>
            <ChatPanel sessionId={id} currentUserId={me} names={names} readOnly={chatReadOnly} />
          </Card>
        ) : null}
      </ScrollView>

      {canReview && partnerId ? (
        <ReviewModal
          visible={reviewOpen}
          onClose={closeReview}
          sessionId={id}
          revieweeId={partnerId}
          revieweeName={partnerName}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
