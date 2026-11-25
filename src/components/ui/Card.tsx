import type { PropsWithChildren } from "react";
import { Pressable, View, type PressableProps } from "react-native";

const CARD = "gap-3 rounded-2xl border border-slate-200 bg-white p-4";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <View className={`${CARD} ${className ?? ""}`}>{children}</View>;
}

export function PressableCard({ children, className, ...rest }: PropsWithChildren<PressableProps>) {
  return (
    <Pressable accessibilityRole="button" className={`${CARD} active:bg-slate-50 ${className ?? ""}`} {...rest}>
      {children}
    </Pressable>
  );
}
