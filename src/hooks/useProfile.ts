import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { PUBLIC_PROFILE_COLUMNS, type PublicProfile, type UserDiscipline } from "@/types/models";

export type MyProfile = PublicProfile & { disciplines: UserDiscipline[] };

async function fetchProfile(userId: string): Promise<MyProfile> {
  const [profileResult, disciplinesResult] = await Promise.all([
    supabase.from("users").select(PUBLIC_PROFILE_COLUMNS).eq("id", userId).single(),
    supabase.from("user_disciplines").select("*").eq("user_id", userId).order("created_at"),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (disciplinesResult.error) throw disciplinesResult.error;
  return { ...profileResult.data, disciplines: disciplinesResult.data };
}

/** The signed-in athlete's profile + disciplines. Disabled while signed out. */
export function useMyProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.profile(userId ?? "anonymous"),
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  });
}
