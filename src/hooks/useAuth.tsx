import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, isLoading: true });

/** Completes a magic-link sign-in when the app is opened from the email link (native only). */
async function handleAuthRedirect(url: string | null) {
  if (!url) return;
  const { queryParams } = Linking.parse(url);
  const code = queryParams?.code;
  if (typeof code === "string") {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.warn("Magic link sign-in failed:", error.message);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const url = Linking.useURL();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // On web, supabase-js handles the redirect itself via detectSessionInUrl.
    if (Platform.OS !== "web") void handleAuthRedirect(url);
  }, [url]);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
