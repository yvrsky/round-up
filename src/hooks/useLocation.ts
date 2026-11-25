import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Platform } from "react-native";

import { FALLBACK_COORDS } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  /** True when we couldn't get a real fix and are using FALLBACK_COORDS. */
  isFallback: boolean;
  fallbackReason?: "denied" | "unavailable";
};

const POSITION_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Location request timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function resolveLocation(): Promise<ResolvedLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return { ...FALLBACK_COORDS, isFallback: true, fallbackReason: "denied" };
    }

    // A recent cached fix is instant and good enough for a "nearby" search (native only).
    const lastKnown =
      Platform.OS === "web" ? null : await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
    const position =
      lastKnown ??
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        POSITION_TIMEOUT_MS
      ));

    return { latitude: position.coords.latitude, longitude: position.coords.longitude, isFallback: false };
  } catch {
    return { ...FALLBACK_COORDS, isFallback: true, fallbackReason: "unavailable" };
  }
}

/**
 * Current device location, cached app-wide for 5 minutes. Never errors: falls back to
 * FALLBACK_COORDS when permission is denied or no fix is available.
 */
export function useLocation() {
  const query = useQuery({
    queryKey: queryKeys.location,
    queryFn: resolveLocation,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return { location: query.data ?? null, isLoading: query.isPending, refresh: query.refetch };
}
