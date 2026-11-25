import { Text, View } from "react-native";

import { DISCIPLINE_LABELS } from "@/lib/constants";
import type { Discipline } from "@/types/models";

const DISCIPLINE_COLORS: Record<Discipline, string> = {
  muay_thai: "bg-rose-100 text-rose-800",
  bjj_gi: "bg-indigo-100 text-indigo-800",
  bjj_nogi: "bg-violet-100 text-violet-800",
  boxing: "bg-orange-100 text-orange-800",
  running: "bg-emerald-100 text-emerald-800",
};

export function DisciplinePill({ discipline, detail }: { discipline: Discipline; detail?: string | null }) {
  const [bg, fg] = DISCIPLINE_COLORS[discipline].split(" ");
  return (
    <View className={`self-start rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${fg}`}>
        {DISCIPLINE_LABELS[discipline]}
        {detail ? ` · ${detail}` : ""}
      </Text>
    </View>
  );
}
