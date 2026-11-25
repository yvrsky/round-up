import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

const STAR_COLOR = "#F59E0B";

type DisplayProps = {
  rating: number;
  /** Number of sessions the rating is based on; shown as "(12)" and "New" when 0. */
  count?: number;
  size?: number;
};

/** Read-only Control Rating: five stars with halves, plus the numeric value. */
export function ControlRatingStars({ rating, count, size = 14 }: DisplayProps) {
  const isNew = count === 0;
  return (
    <View
      className="flex-row items-center gap-1"
      accessible
      accessibilityLabel={isNew ? "No control rating yet" : `Control rating ${rating.toFixed(1)} out of 5`}
    >
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => {
          const name = rating >= star ? "star" : rating >= star - 0.5 ? "star-half" : "star-outline";
          return <Ionicons key={star} name={name} size={size} color={isNew ? "#CBD5E1" : STAR_COLOR} />;
        })}
      </View>
      <Text className="text-xs font-semibold text-slate-600">
        {isNew ? "New" : rating.toFixed(1)}
        {count ? ` (${count})` : ""}
      </Text>
    </View>
  );
}

type InputProps = {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
};

/** Tap-to-rate 1–5 input used in the review modal. */
export function StarRatingInput({ label, description, value, onChange }: InputProps) {
  return (
    <View className="gap-2">
      <View>
        <Text className="text-base font-semibold text-ink">{label}</Text>
        {description ? <Text className="text-sm text-slate-500">{description}</Text> : null}
      </View>
      <View className="flex-row gap-2" accessibilityRole="adjustable" accessibilityLabel={`${label}: ${value} of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
            hitSlop={6}
          >
            <Ionicons name={value >= star ? "star" : "star-outline"} size={34} color={STAR_COLOR} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
