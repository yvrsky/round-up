import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or empty. Set both in .env.local, then restart `npx expo start` (env files are only read at startup)."
  );
}

/**
 * Some platforms reject SecureStore values above ~2KB, and a Supabase session
 * (JWT + refresh token + user object) can exceed that. Values are split into
 * chunks stored under `<key>.<index>`, with the chunk count stored under `<key>`.
 */
const CHUNK_SIZE = 1800;

const chunkedSecureStore: SupportedStorage = {
  async getItem(key) {
    const countRaw = await SecureStore.getItemAsync(key);
    if (countRaw === null) return null;
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 0) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`))
    );
    if (chunks.some((c) => c === null)) return null;
    return chunks.join("");
  },
  async setItem(key, value) {
    await chunkedSecureStore.removeItem(key);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(key, String(count));
  },
  async removeItem(key) {
    const countRaw = await SecureStore.getItemAsync(key);
    const count = Number(countRaw ?? 0);
    await SecureStore.deleteItemAsync(key);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  },
};

// SecureStore is native-only. On web use localStorage, guarded for static (server) rendering.
const webStorage: SupportedStorage = {
  getItem: (key) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? webStorage : chunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    flowType: "pkce",
  },
});

// Only refresh tokens while the app is in the foreground (native).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
