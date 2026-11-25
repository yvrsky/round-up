import { Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { GEAR, GEAR_LABELS } from "@/lib/constants";
import type { Discipline } from "@/types/models";

type EditableProps = {
  disciplines: readonly Discipline[];
  selected: ReadonlySet<string>;
  onToggle: (slug: string) => void;
};

/** Gear relevant to the chosen disciplines, as toggleable chips. */
export function GearChecklist({ disciplines, selected, onToggle }: EditableProps) {
  const relevant = GEAR.filter((g) => g.disciplines.some((d) => disciplines.includes(d)));
  if (relevant.length === 0) {
    return <Text className="text-sm text-slate-500">Pick a discipline first.</Text>;
  }
  return (
    <View className="flex-row flex-wrap gap-2">
      {relevant.map((item) => (
        <Chip key={item.slug} label={item.label} selected={selected.has(item.slug)} onPress={() => onToggle(item.slug)} />
      ))}
    </View>
  );
}

/** Read-only list of gear slugs. */
export function GearList({ equipment }: { equipment: readonly string[] }) {
  if (equipment.length === 0) return <Text className="text-sm text-slate-500">No gear listed</Text>;
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {equipment.map((slug) => (
        <View key={slug} className="rounded-md bg-slate-100 px-2 py-1">
          <Text className="text-xs text-slate-700">{GEAR_LABELS[slug] ?? slug}</Text>
        </View>
      ))}
    </View>
  );
}

/** `equipment` is JSONB in the database; keep only string entries. */
export function parseEquipment(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
