import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useLocation } from "@/hooks/useLocation";
import { useMyProfile } from "@/hooks/useProfile";
import { queryKeys, roundCoord, type NearbySessionsParams } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { useFilterStore } from "@/store/useFilterStore";
import type { NearbySession } from "@/types/models";

async function fetchNearbySessions(params: NearbySessionsParams): Promise<NearbySession[]> {
  const { data, error } = await supabase.rpc("get_nearby_sessions", {
    user_lat: params.latitude,
    user_lng: params.longitude,
    radius_meters: params.radiusKm * 1000,
    discipline: params.discipline ?? undefined,
    intensity_filter: params.intensity ?? undefined,
    // Always pass the viewer's weight: sessions they're outside the bounds of can't be joined anyway.
    user_weight: params.userWeight ?? undefined,
    weight_tolerance_kg: params.weightToleranceKg ?? undefined,
  });
  if (error) throw error;
  return data;
}

/** Open sessions near the user, driven by the filter store. */
export function useNearbySessions() {
  const { location, isLoading: locationLoading } = useLocation();
  const profile = useMyProfile();
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const discipline = useFilterStore((s) => s.discipline);
  const intensity = useFilterStore((s) => s.intensity);
  const weightToleranceKg = useFilterStore((s) => s.weightToleranceKg);

  const params: NearbySessionsParams | null = location
    ? {
        latitude: roundCoord(location.latitude),
        longitude: roundCoord(location.longitude),
        radiusKm,
        discipline,
        intensity,
        weightToleranceKg,
        userWeight: profile.data?.weight_kg ?? null,
      }
    : null;

  const query = useQuery({
    queryKey: params ? queryKeys.nearbySessions(params) : ["sessions", "nearby", "awaiting-location"],
    queryFn: () => {
      if (!params) throw new Error("Location not resolved yet");
      return fetchNearbySessions(params);
    },
    enabled: params !== null && profile.isSuccess,
    placeholderData: keepPreviousData,
  });

  return { ...query, location, isLocating: locationLoading };
}
