import { Stack } from "expo-router";

import { useAuth } from "@/hooks/useAuth";

/**
 * Onboarding requires a signed-in user. It stays reachable after it's finished because it doubles
 * as "Edit profile". Login isn't guarded here: a Stack.Protected guard on it dispatches
 * REMOVE_ROUTES on sign-in, which is unhandled (and warns) when login is no longer in the stack, so
 * the login screen redirects signed-in users itself.
 */
export default function AuthLayout() {
  const { session } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Protected guard={Boolean(session)} redirectTo="/login">
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
