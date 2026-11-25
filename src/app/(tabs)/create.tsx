import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPicker, type Coords } from "@/components/session/LocationPicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { FieldGroup } from "@/components/ui/Sheet";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useLocation } from "@/hooks/useLocation";
import { useNearbyGyms } from "@/hooks/useNearbyGyms";
import { useNow } from "@/hooks/useNow";
import { useMyProfile, type MyProfile } from "@/hooks/useProfile";
import { useCreateSession } from "@/hooks/useSession";
import { DISCIPLINE_LABELS, DISCIPLINES, INTENSITIES, INTENSITY_LABELS } from "@/lib/constants";
import { errorMessage, formatDistance, formatFee } from "@/lib/format";
import type { Discipline, Intensity } from "@/types/models";

const DAYS_AHEAD = 14;
const FIRST_SLOT_HOUR = 6;
const LAST_SLOT_HOUR = 22;
/** Sessions must start at least this far in the future. */
const MIN_LEAD_MS = 15 * 60_000;

const ROUNDS_PLACEHOLDER: Record<Discipline, string> = {
  muay_thai: "e.g. 5x3 min",
  boxing: "e.g. 6x3 min",
  bjj_gi: "e.g. 6x6 min rolls",
  bjj_nogi: "e.g. 6x6 min rolls",
  running: "e.g. 10 km easy",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayLabel(date: Date, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return date.toLocaleDateString([], { weekday: "short", day: "numeric" });
}

/** Minutes since midnight for each 30-minute slot. */
const SLOTS = Array.from({ length: (LAST_SLOT_HOUR - FIRST_SLOT_HOUR) * 2 + 1 }, (_, i) => FIRST_SLOT_HOUR * 60 + i * 30);

function slotLabel(minutes: number): string {
  const d = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseOptionalNumber(value: string): number | null | "invalid" {
  if (!value.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : "invalid";
}

type VenueKind = "gym" | "pin";

export default function CreateSessionScreen() {
  const profile = useMyProfile();

  if (profile.isPending) return <LoadingState />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  // Mount the form once the profile is loaded so its defaults can be initial state, not effects.
  return <CreateSessionForm profile={profile.data} />;
}

function CreateSessionForm({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const { location } = useLocation();
  const gyms = useNearbyGyms(location);
  const createSession = useCreateSession();
  const now = useNow();

  const todayStart = startOfDay(new Date(now)).getTime();
  const days = useMemo(() => {
    const today = new Date(todayStart);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }, [todayStart]);

  // Defaults from the athlete's profile: their first discipline and ±5 kg around their weight.
  const [discipline, setDiscipline] = useState<Discipline>(() => profile.disciplines[0]?.discipline_slug ?? "muay_thai");
  const [minWeight, setMinWeight] = useState(() =>
    profile.weight_kg != null ? String(Math.max(30, Math.round(profile.weight_kg) - 5)) : ""
  );
  const [maxWeight, setMaxWeight] = useState(() => (profile.weight_kg != null ? String(Math.round(profile.weight_kg) + 5) : ""));
  const [intensity, setIntensity] = useState<Intensity>("technical_light");
  const [dayIndex, setDayIndex] = useState(1);
  const [slot, setSlot] = useState<number | null>(18 * 60);
  const [venueKind, setVenueKind] = useState<VenueKind>("gym");
  const [gymId, setGymId] = useState<string | null>(null);
  // The pin follows the user's location until they move it.
  const [movedPin, setPin] = useState<Coords | null>(null);
  const pin: Coords | null = movedPin ?? (location ? { latitude: location.latitude, longitude: location.longitude } : null);
  const [roundsFormat, setRoundsFormat] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const scheduledAt = slot === null ? null : new Date(days[dayIndex].getTime() + slot * 60_000);
  const slotIsPast = (minutes: number) => days[dayIndex].getTime() + minutes * 60_000 < now + MIN_LEAD_MS;

  function resetForm() {
    setRoundsFormat("");
    setNotes("");
    setGymId(null);
    setFormError(null);
  }

  function submit() {
    if (!scheduledAt || scheduledAt.getTime() < Date.now() + MIN_LEAD_MS) return setFormError("Pick a time at least 15 minutes from now.");
    if (venueKind === "gym" && !gymId) return setFormError("Pick a gym, or switch to a custom pin.");
    if (venueKind === "pin" && !pin) return setFormError("Set a meeting point.");
    const min = parseOptionalNumber(minWeight);
    const max = parseOptionalNumber(maxWeight);
    if (min === "invalid" || max === "invalid") return setFormError("Partner weights must be positive numbers.");
    if (min !== null && max !== null && min > max) return setFormError("Minimum partner weight is above the maximum.");
    setFormError(null);

    createSession.mutate(
      {
        discipline,
        intensity,
        scheduledAt,
        venue: venueKind === "gym" ? { kind: "gym", gymId: gymId as string } : { kind: "pin", ...(pin as Coords) },
        roundsFormat: roundsFormat.trim() || null,
        minPartnerWeight: min,
        maxPartnerWeight: max,
        notes: notes.trim() || null,
      },
      {
        onSuccess: (id) => {
          resetForm();
          router.push({ pathname: "/session/[id]", params: { id } });
        },
      }
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="gap-6 p-5 pb-12" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-bold text-ink">Create Session</Text>

        <FieldGroup label="Discipline">
          <View className="flex-row flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <Chip key={d} label={DISCIPLINE_LABELS[d]} selected={discipline === d} onPress={() => setDiscipline(d)} />
            ))}
          </View>
        </FieldGroup>

        <FieldGroup label="Intensity" hint="Be honest: partners pick sessions by intensity.">
          <View className="flex-row flex-wrap gap-2">
            {INTENSITIES.map((i) => (
              <Chip key={i} label={INTENSITY_LABELS[i]} selected={intensity === i} onPress={() => setIntensity(i)} />
            ))}
          </View>
        </FieldGroup>

        <FieldGroup label="When">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {days.map((d, i) => (
              <Chip
                key={d.toISOString()}
                label={dayLabel(d, i)}
                selected={dayIndex === i}
                onPress={() => {
                  setDayIndex(i);
                  if (slot !== null && days[i].getTime() + slot * 60_000 < Date.now() + MIN_LEAD_MS) setSlot(null);
                }}
              />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {SLOTS.map((m) => (
              <Chip key={m} label={slotLabel(m)} selected={slot === m} disabled={slotIsPast(m)} onPress={() => setSlot(m)} />
            ))}
          </ScrollView>
        </FieldGroup>

        <FieldGroup label="Venue">
          <View className="flex-row gap-2">
            <Chip label="Gym" selected={venueKind === "gym"} onPress={() => setVenueKind("gym")} />
            <Chip label="Custom pin" selected={venueKind === "pin"} onPress={() => setVenueKind("pin")} />
          </View>

          {venueKind === "gym" ? (
            gyms.isPending ? (
              <LoadingState label="Finding gyms…" />
            ) : gyms.isError ? (
              <ErrorState error={gyms.error} onRetry={() => void gyms.refetch()} />
            ) : gyms.data.length === 0 ? (
              <Text className="text-sm text-slate-500">No gyms within 15 km. Use a custom pin instead.</Text>
            ) : (
              <View className="gap-2">
                {gyms.data.map((g) => {
                  const fee = formatFee(g.drop_in_fee_cents, g.currency);
                  const selected = gymId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setGymId(g.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      className={`gap-0.5 rounded-xl border p-3 ${selected ? "border-brand bg-rose-50" : "border-slate-200 bg-white active:bg-slate-50"}`}
                    >
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="flex-1 font-semibold text-ink">{g.name}</Text>
                        <Text className="text-xs text-slate-500">{formatDistance(g.distance_meters)}</Text>
                      </View>
                      <Text className="text-sm text-slate-500" numberOfLines={1}>
                        {g.address}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {fee ? `Drop-in ${fee}` : "Free / no drop-in fee"}
                        {g.is_partner ? " · Partner gym" : ""}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : pin ? (
            <LocationPicker value={pin} onChange={setPin} />
          ) : (
            <LoadingState label="Getting your location…" />
          )}
        </FieldGroup>

        <Input
          label="Rounds / format"
          value={roundsFormat}
          onChangeText={setRoundsFormat}
          placeholder={ROUNDS_PLACEHOLDER[discipline]}
          maxLength={40}
        />

        <FieldGroup label="Partner weight (kg)" hint="Leave blank for no limit. Athletes outside this range can't request.">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input value={minWeight} onChangeText={setMinWeight} keyboardType="decimal-pad" placeholder="Min" accessibilityLabel="Minimum partner weight" />
            </View>
            <View className="flex-1">
              <Input value={maxWeight} onChangeText={setMaxWeight} keyboardType="decimal-pad" placeholder="Max" accessibilityLabel="Maximum partner weight" />
            </View>
          </View>
        </FieldGroup>

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Focus, rules, what to bring…"
          multiline
          maxLength={1000}
          className="h-24 py-3"
          textAlignVertical="top"
        />

        {formError || createSession.isError ? (
          <Text className="text-sm text-red-600">{formError ?? errorMessage(createSession.error)}</Text>
        ) : null}

        <Button title="Post session" onPress={submit} loading={createSession.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}
