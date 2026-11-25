export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return "";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function formatSessionTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - startOfToday.getTime()) / 86_400_000
  );
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Tomorrow · ${time}`;
  if (dayDiff === -1) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
}

export function formatWeightRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${min}–${max} kg`;
  if (min != null) return `≥ ${min} kg`;
  if (max != null) return `≤ ${max} kg`;
  return null;
}

export function formatFee(cents: number | null, currency: string | null): string | null {
  if (cents == null) return null;
  return `${(cents / 100).toFixed(0)} ${currency ?? ""}`.trim();
}

/** Supabase/PostgREST errors are plain objects with `message`; normalise anything thrown. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
