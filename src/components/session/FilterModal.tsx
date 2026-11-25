import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FieldGroup, Sheet } from "@/components/ui/Sheet";
import {
  DISCIPLINE_LABELS,
  DISCIPLINES,
  INTENSITIES,
  INTENSITY_LABELS,
  RADIUS_OPTIONS_KM,
  WEIGHT_TOLERANCE_OPTIONS_KG,
} from "@/lib/constants";
import { useFilterStore } from "@/store/useFilterStore";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Weight tolerance needs the viewer's weight; disabled if their profile has none. */
  userWeightKg: number | null;
};

export function FilterModal({ visible, onClose, userWeightKg }: FilterModalProps) {
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const discipline = useFilterStore((s) => s.discipline);
  const intensity = useFilterStore((s) => s.intensity);
  const weightToleranceKg = useFilterStore((s) => s.weightToleranceKg);
  const { setRadiusKm, setDiscipline, setIntensity, setWeightToleranceKg, reset } = useFilterStore.getState();

  return (
    <Sheet
      visible={visible}
      title="Filters"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button title="Reset" variant="secondary" onPress={reset} className="flex-1" />
          <Button title="Show sessions" onPress={onClose} className="flex-1" />
        </View>
      }
    >
      <FieldGroup label={`Distance · within ${radiusKm} km`}>
        <View className="flex-row flex-wrap gap-2">
          {RADIUS_OPTIONS_KM.map((km) => (
            <Chip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => setRadiusKm(km)} />
          ))}
        </View>
      </FieldGroup>

      <FieldGroup label="Discipline">
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Any" selected={discipline === null} onPress={() => setDiscipline(null)} />
          {DISCIPLINES.map((d) => (
            <Chip key={d} label={DISCIPLINE_LABELS[d]} selected={discipline === d} onPress={() => setDiscipline(d)} />
          ))}
        </View>
      </FieldGroup>

      <FieldGroup label="Intensity">
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Any" selected={intensity === null} onPress={() => setIntensity(null)} />
          {INTENSITIES.map((i) => (
            <Chip key={i} label={INTENSITY_LABELS[i]} selected={intensity === i} onPress={() => setIntensity(i)} />
          ))}
        </View>
      </FieldGroup>

      <FieldGroup
        label="Partner size"
        hint={
          userWeightKg != null
            ? `Creators within this range of your weight (${userWeightKg} kg).`
            : "Add your weight to your profile to filter by size."
        }
      >
        <View className="flex-row flex-wrap gap-2">
          {WEIGHT_TOLERANCE_OPTIONS_KG.map((kg) => (
            <Chip
              key={kg ?? "any"}
              label={kg === null ? "Any size" : `±${kg} kg`}
              selected={weightToleranceKg === kg}
              onPress={() => setWeightToleranceKg(kg)}
              disabled={kg !== null && userWeightKg == null}
            />
          ))}
        </View>
      </FieldGroup>

      <Text className="text-xs text-slate-500">
        Sessions whose partner weight limits exclude you are always hidden, since you couldn&apos;t join them.
      </Text>
    </Sheet>
  );
}
