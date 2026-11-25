import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

import { BRAND_COLOR } from "@/lib/constants";

type IconName = ComponentProps<typeof Ionicons>["name"];
type IconColor = ComponentProps<typeof Ionicons>["color"];

/** Tab tints are strings, but the navigator types them as any ColorValue (incl. null/number). */
function toIconColor(color: ColorValue): IconColor {
  return typeof color === "number" || color === null ? undefined : color;
}

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={toIconColor(color)} size={size} />;
  };
}

// Access control lives in the root layout's auth guard.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: BRAND_COLOR }}>
      <Tabs.Screen name="index" options={{ title: "Board", tabBarIcon: tabIcon("compass-outline") }} />
      <Tabs.Screen name="create" options={{ title: "Create", tabBarIcon: tabIcon("add-circle-outline") }} />
      <Tabs.Screen name="my-sessions" options={{ title: "My Sessions", tabBarIcon: tabIcon("calendar-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tabIcon("person-outline") }} />
    </Tabs>
  );
}
