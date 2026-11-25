import { Text, View } from "react-native";

import type { LocationPickerProps } from "./LocationPicker";

/** No embedded map on web: the pin is your current location. */
export function LocationPicker({ value }: LocationPickerProps) {
  return (
    <View className="gap-1 rounded-xl border border-slate-200 bg-white p-4">
      <Text className="font-semibold text-ink">Your current location</Text>
      <Text className="text-sm text-slate-500">
        {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
      </Text>
      <Text className="text-xs text-slate-500">Use the mobile app to place a pin on the map.</Text>
    </View>
  );
}
