import { Text, View } from "react-native";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONES: Record<BadgeTone, { container: string; label: string }> = {
  neutral: { container: "bg-slate-100", label: "text-slate-700" },
  brand: { container: "bg-rose-100", label: "text-rose-800" },
  success: { container: "bg-emerald-100", label: "text-emerald-800" },
  warning: { container: "bg-amber-100", label: "text-amber-800" },
  danger: { container: "bg-red-100", label: "text-red-800" },
  info: { container: "bg-sky-100", label: "text-sky-800" },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${TONES[tone].container}`}>
      <Text className={`text-xs font-semibold ${TONES[tone].label}`}>{label}</Text>
    </View>
  );
}
