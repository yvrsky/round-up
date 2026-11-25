import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
}>;

/** Full-height modal sheet with a header, scrollable body, and optional sticky footer. */
export function Sheet({ visible, title, onClose, footer, children }: SheetProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}>
      <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-50">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <Text className="text-lg font-bold text-ink">{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={12}>
              <Text className="text-base font-semibold text-brand">Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View className="border-t border-slate-200 bg-white p-4">{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export function FieldGroup({ label, hint, children }: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <View className="gap-2.5">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</Text>
        {hint ? <Text className="text-sm text-slate-500">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
