import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { session } = useAuth();
  // Signed in → the root guard decides between onboarding and the app.
  if (session) return <Redirect href="/" />;
  return <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: Linking.createURL("/login") },
    });
    setLoading(false);
    if (otpError) setError(otpError.message);
    else setSent(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text className="text-4xl font-extrabold text-ink">RoundUp</Text>
          <Text className="text-base text-slate-600">Find safe, skill-matched training partners near you.</Text>
        </View>

        {sent ? (
          <View className="gap-4">
            <Text className="text-base text-ink">
              Check <Text className="font-semibold">{email.trim()}</Text> for a sign-in link.
            </Text>
            <Button title="Use a different email" variant="secondary" onPress={() => setSent(false)} />
          </View>
        ) : (
          <View className="gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={sendMagicLink}
              error={error}
            />
            <Button title="Send magic link" onPress={sendMagicLink} loading={loading} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
