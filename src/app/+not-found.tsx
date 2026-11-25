import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: true }} />
      <View className="flex-1 items-center justify-center gap-4 bg-slate-50 p-5">
        <Text className="text-xl font-semibold text-ink">This screen doesn&apos;t exist.</Text>
        <Link href="/" className="text-base font-semibold text-brand">
          Go to the Session Board
        </Link>
      </View>
    </>
  );
}
