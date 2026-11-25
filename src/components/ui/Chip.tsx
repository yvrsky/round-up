import { Pressable, Text } from "react-native";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/** Selectable pill for single/multi-choice inputs. */
export function Chip({ label, selected, onPress, disabled }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      className={`rounded-full border px-3.5 py-2 ${
        selected ? "border-brand bg-brand" : "border-slate-300 bg-white active:bg-slate-100"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <Text className={`text-sm font-medium ${selected ? "text-white" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
