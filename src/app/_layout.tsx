import "../../global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ErrorState } from "@/components/ui/StateViews";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/useProfile";
import { BRAND_COLOR } from "@/lib/constants";
import { queryClient } from "@/lib/queryClient";

SplashScreen.preventAutoHideAsync();

/**
 * Auth guard (declarative, via Stack.Protected):
 * - the app (tabs + session screens) requires a signed-in, onboarded athlete;
 * - otherwise it redirects to onboarding (signed in) or login (signed out).
 * The (auth) group's own layout guards login/onboarding the other way round.
 */
function RootNavigator() {
  const { session, isLoading: authLoading } = useAuth();
  const profile = useMyProfile();

  const signedIn = Boolean(session);
  const isReady = !authLoading && (!signedIn || profile.isSuccess || profile.isError);
  const isOnboarded = Boolean(profile.data?.onboarding_completed_at);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn && isOnboarded} redirectTo={signedIn ? "/onboarding" : "/login"}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="session/[id]"
          options={{ headerShown: true, title: "Session", headerBackTitle: "Back", headerTintColor: BRAND_COLOR }}
        />
      </Stack.Protected>
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
