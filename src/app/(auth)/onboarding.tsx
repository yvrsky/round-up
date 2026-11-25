import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GearChecklist, parseEquipment } from "@/components/profile/GearChecklist";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { FieldGroup } from "@/components/ui/Sheet";
import { LoadingState } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, type MyProfile } from "@/hooks/useProfile";
import {
  DISCIPLINE_LABELS,
  DISCIPLINES,
  GEAR,
  RANK_PLACEHOLDERS,
  STANCE_LABELS,
  STANCES,
} from "@/lib/constants";
import { errorMessage } from "@/lib/format";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import type { Discipline, Stance } from "@/types/models";

const STEPS = ["Your stats", "Disciplines", "Gear"] as const;

/** Experience is picked from buckets; we store a representative month count. */
const EXPERIENCE_BUCKETS = [
  { label: "< 6 months", months: 3 },
  { label: "6–12 months", months: 9 },
  { label: "1–2 years", months: 18 },
  { label: "2–5 years", months: 42 },
  { label: "5+ years", months: 72 },
] as const;

function nearestBucket(months: number): number {
  return EXPERIENCE_BUCKETS.reduce((best, b) =>
    Math.abs(b.months - months) < Math.abs(best.months - months) ? b : best
  ).months;
}

type DisciplineDraft = { experienceMonths: number | null; rankLabel: string };

type Draft = {
  fullName: string;
  weightKg: string;
  heightCm: string;
  stance: Stance | null;
  disciplines: Partial<Record<Discipline, DisciplineDraft>>;
  gear: Set<string>;
};

function draftFromProfile(profile: MyProfile): Draft {
  const disciplines: Draft["disciplines"] = {};
  const gear = new Set<string>();
  for (const d of profile.disciplines) {
    disciplines[d.discipline_slug] = {
      experienceMonths: nearestBucket(d.experience_months),
      rankLabel: d.rank_label ?? "",
    };
    parseEquipment(d.equipment).forEach((slug) => gear.add(slug));
  }
  return {
    fullName: profile.full_name ?? "",
    weightKg: profile.weight_kg != null ? String(profile.weight_kg) : "",
    heightCm: profile.height_cm != null ? String(profile.height_cm) : "",
    stance: profile.stance ?? null,
    disciplines,
    gear,
  };
}

function parseNumber(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return value.trim() !== "" && Number.isFinite(n) ? n : null;
}

/** Returns an error message for the step, or null if it's complete. */
function validateStep(step: number, draft: Draft): string | null {
  if (step === 0) {
    if (!draft.fullName.trim()) return "Enter your name.";
    const weight = parseNumber(draft.weightKg);
    if (weight === null || weight < 30 || weight > 250) return "Enter a weight between 30 and 250 kg.";
    const height = parseNumber(draft.heightCm);
    if (height === null || !Number.isInteger(height) || height < 100 || height > 250)
      return "Enter a height between 100 and 250 cm.";
    if (!draft.stance) return "Pick your stance.";
  }
  if (step === 1) {
    const entries = Object.values(draft.disciplines);
    if (entries.length === 0) return "Pick at least one discipline.";
    if (entries.some((d) => d.experienceMonths === null)) return "Set your experience for each discipline.";
  }
  return null;
}

async function saveProfile(userId: string, draft: Draft, alreadyOnboarded: boolean) {
  const { error: profileError } = await supabase
    .from("users")
    .update({
      full_name: draft.fullName.trim(),
      weight_kg: parseNumber(draft.weightKg),
      height_cm: parseNumber(draft.heightCm),
      stance: draft.stance,
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  const selected = Object.keys(draft.disciplines) as Discipline[];

  const { error: deleteError } = await supabase
    .from("user_disciplines")
    .delete()
    .eq("user_id", userId)
    .not("discipline_slug", "in", `(${selected.join(",")})`);
  if (deleteError) throw deleteError;

  const rows = selected.map((slug) => {
    const d = draft.disciplines[slug] as DisciplineDraft;
    const relevantGear = GEAR.filter((g) => g.disciplines.includes(slug) && draft.gear.has(g.slug)).map((g) => g.slug);
    return {
      discipline_slug: slug,
      experience_months: d.experienceMonths ?? 0,
      rank_label: d.rankLabel.trim() || null,
      equipment: relevantGear,
    };
  });
  const { error: upsertError } = await supabase
    .from("user_disciplines")
    .upsert(rows, { onConflict: "user_id,discipline_slug" });
  if (upsertError) throw upsertError;

  if (!alreadyOnboarded) {
    const { error } = await supabase
      .from("users")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  }
}

export default function OnboardingScreen() {
  const { session } = useAuth();
  const profile = useMyProfile();

  if (!session || !profile.isSuccess) return <LoadingState />;
  // Mount the form only once the profile is loaded, so it can pre-fill (when editing) without an effect.
  return <OnboardingForm userId={session.user.id} profile={profile.data} />;
}

function OnboardingForm({ userId, profile }: { userId: string; profile: MyProfile }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => draftFromProfile(profile));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Fixed at mount: whether this is first-time onboarding or "Edit profile".
  const [alreadyOnboarded] = useState(() => Boolean(profile.onboarding_completed_at));

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  function toggleDiscipline(slug: Discipline) {
    const next = { ...draft.disciplines };
    if (next[slug]) delete next[slug];
    else next[slug] = { experienceMonths: null, rankLabel: "" };
    update({ disciplines: next });
  }

  function patchDiscipline(slug: Discipline, patch: Partial<DisciplineDraft>) {
    const current = draft.disciplines[slug];
    if (!current) return;
    update({ disciplines: { ...draft.disciplines, [slug]: { ...current, ...patch } } });
  }

  function toggleGear(slug: string) {
    const next = new Set(draft.gear);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    update({ gear: next });
  }

  async function next() {
    const problem = validateStep(step, draft);
    setError(problem);
    if (problem) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    try {
      await saveProfile(userId, draft, alreadyOnboarded);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      // The guard lets onboarded users stay here (profile editing), so leave explicitly.
      router.replace(alreadyOnboarded ? "/profile" : "/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const selectedDisciplines = Object.keys(draft.disciplines) as Discipline[];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="gap-3 px-5 pb-2 pt-4">
          <Text className="text-sm font-semibold text-brand">
            Step {step + 1} of {STEPS.length}
          </Text>
          <Text className="text-3xl font-bold text-ink">{STEPS[step]}</Text>
          <View className="h-1.5 flex-row gap-1.5">
            {STEPS.map((s, i) => (
              <View key={s} className={`flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-slate-200"}`} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <>
              <Text className="text-base text-slate-600">
                Partners are matched on size and stance. Weight and height are shown on your profile.
              </Text>
              <Input
                label="Name"
                value={draft.fullName}
                onChangeText={(fullName) => update({ fullName })}
                autoComplete="name"
                textContentType="name"
                maxLength={120}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Weight (kg)"
                    value={draft.weightKg}
                    onChangeText={(weightKg) => update({ weightKg })}
                    keyboardType="decimal-pad"
                    placeholder="72.5"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Height (cm)"
                    value={draft.heightCm}
                    onChangeText={(heightCm) => update({ heightCm })}
                    keyboardType="number-pad"
                    placeholder="178"
                  />
                </View>
              </View>
              <FieldGroup label="Stance">
                <View className="flex-row flex-wrap gap-2">
                  {STANCES.map((s) => (
                    <Chip key={s} label={STANCE_LABELS[s]} selected={draft.stance === s} onPress={() => update({ stance: s })} />
                  ))}
                </View>
              </FieldGroup>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <FieldGroup label="What do you train?">
                <View className="flex-row flex-wrap gap-2">
                  {DISCIPLINES.map((d) => (
                    <Chip
                      key={d}
                      label={DISCIPLINE_LABELS[d]}
                      selected={Boolean(draft.disciplines[d])}
                      onPress={() => toggleDiscipline(d)}
                    />
                  ))}
                </View>
              </FieldGroup>
              {selectedDisciplines.map((slug) => {
                const d = draft.disciplines[slug] as DisciplineDraft;
                return (
                  <View key={slug} className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <Text className="text-lg font-bold text-ink">{DISCIPLINE_LABELS[slug]}</Text>
                    <FieldGroup label="Experience">
                      <View className="flex-row flex-wrap gap-2">
                        {EXPERIENCE_BUCKETS.map((b) => (
                          <Chip
                            key={b.months}
                            label={b.label}
                            selected={d.experienceMonths === b.months}
                            onPress={() => patchDiscipline(slug, { experienceMonths: b.months })}
                          />
                        ))}
                      </View>
                    </FieldGroup>
                    <Input
                      label={slug === "running" ? "Typical pace" : "Rank / level"}
                      value={d.rankLabel}
                      onChangeText={(rankLabel) => patchDiscipline(slug, { rankLabel })}
                      placeholder={RANK_PLACEHOLDERS[slug]}
                      maxLength={60}
                    />
                  </View>
                );
              })}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text className="text-base text-slate-600">
                What protective gear do you own? Partners see this so you can sort out who brings what.
              </Text>
              <GearChecklist disciplines={selectedDisciplines} selected={draft.gear} onToggle={toggleGear} />
            </>
          ) : null}

          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        </ScrollView>

        <View className="flex-row gap-3 border-t border-slate-200 bg-white p-4">
          {step > 0 ? (
            <Button title="Back" variant="secondary" onPress={() => { setError(null); setStep(step - 1); }} className="flex-1" />
          ) : alreadyOnboarded ? (
            <Button title="Cancel" variant="secondary" onPress={() => router.replace("/profile")} className="flex-1" />
          ) : null}
          <Button
            title={step === STEPS.length - 1 ? (alreadyOnboarded ? "Save" : "Finish") : "Next"}
            onPress={next}
            loading={saving}
            className="flex-1"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
