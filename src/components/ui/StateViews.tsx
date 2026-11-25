import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { BRAND_COLOR } from "@/lib/constants";
import { errorMessage } from "@/lib/format";

export function LoadingState({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      <ActivityIndicator color={BRAND_COLOR} />
      {label ? <Text className="text-sm text-slate-500">{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View className="items-center justify-center gap-2 px-6 py-12">
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      {body ? <Text className="text-center text-sm text-slate-500">{body}</Text> : null}
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-12">
      <Text className="text-center text-base font-semibold text-ink">Couldn&apos;t load this</Text>
      <Text className="text-center text-sm text-slate-500">{errorMessage(error)}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}
