import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { BRAND_COLOR, DISCIPLINE_LABELS } from "@/lib/constants";
import { formatSessionTime } from "@/lib/format";
import type { NearbySession } from "@/types/models";

export type SessionMapProps = {
  sessions: NearbySession[];
  center: { latitude: number; longitude: number };
  radiusKm: number;
  onSelect: (sessionId: string) => void;
};

/** Venue pins for nearby sessions (native). See SessionMap.web.tsx for the web fallback. */
export function SessionMap({ sessions, center, radiusKm, onSelect }: SessionMapProps) {
  // Show roughly the search radius around the user.
  const delta = Math.max(0.02, (radiusKm / 111) * 2.2);

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...center, latitudeDelta: delta, longitudeDelta: delta }}
      showsUserLocation
    >
      {sessions.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.latitude, longitude: s.longitude }}
          title={`${DISCIPLINE_LABELS[s.discipline_slug]} · ${formatSessionTime(s.scheduled_at)}`}
          description={s.venue_name ?? "Custom location"}
          pinColor={BRAND_COLOR}
          onCalloutPress={() => onSelect(s.id)}
        />
      ))}
    </MapView>
  );
}
