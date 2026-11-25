import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { BRAND_COLOR } from "@/lib/constants";

export type Coords = { latitude: number; longitude: number };

export type LocationPickerProps = {
  value: Coords;
  onChange: (coords: Coords) => void;
};

/** Tap or drag to drop a custom meeting pin (native). See LocationPicker.web.tsx. */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  return (
    <View className="gap-2">
      <View className="h-56 overflow-hidden rounded-xl border border-slate-200">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ ...value, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
          onPress={(e) => onChange(e.nativeEvent.coordinate)}
          showsUserLocation
        >
          <Marker
            coordinate={value}
            draggable
            pinColor={BRAND_COLOR}
            onDragEnd={(e) => onChange(e.nativeEvent.coordinate)}
          />
        </MapView>
      </View>
      <Text className="text-xs text-slate-500">Tap the map or drag the pin to set the meeting point.</Text>
    </View>
  );
}
