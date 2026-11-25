import { useQuery } from "@tanstack/react-query";

import { queryKeys, roundCoord } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import type { NearbyGym } from "@/types/models";

export function useNearbyGyms(coords: { latitude: number; longitude: number } | null) {
  const latitude = coords ? roundCoord(coords.latitude) : 0;
  const longitude = coords ? roundCoord(coords.longitude) : 0;

  return useQuery({
    queryKey: queryKeys.nearbyGyms(latitude, longitude),
    enabled: coords !== null,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<NearbyGym[]> => {
      const { data, error } = await supabase.rpc("get_nearby_gyms", { user_lat: latitude, user_lng: longitude });
      if (error) throw error;
      return data;
    },
  });
}
