import type { Discipline, Intensity, Stance } from "@/types/models";

export const DISCIPLINES: readonly Discipline[] = ["muay_thai", "bjj_gi", "bjj_nogi", "boxing", "running"];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  muay_thai: "Muay Thai",
  bjj_gi: "BJJ Gi",
  bjj_nogi: "BJJ No-Gi",
  boxing: "Boxing",
  running: "Running",
};

/** Placeholder for the free-text rank field — belts for BJJ, pace for running. */
export const RANK_PLACEHOLDERS: Record<Discipline, string> = {
  muay_thai: "e.g. 3 amateur fights",
  bjj_gi: "e.g. Blue Belt",
  bjj_nogi: "e.g. Blue Belt",
  boxing: "e.g. Novice",
  running: "e.g. 5:00 min/km",
};

export const INTENSITIES: readonly Intensity[] = ["technical_light", "drills_only", "moderate", "hard_sparring"];

export const INTENSITY_LABELS: Record<Intensity, string> = {
  technical_light: "Technical / Light",
  drills_only: "Drills only",
  moderate: "Moderate",
  hard_sparring: "Hard sparring",
};

export const STANCES: readonly Stance[] = ["orthodox", "southpaw", "switch"];

export const STANCE_LABELS: Record<Stance, string> = {
  orthodox: "Orthodox",
  southpaw: "Southpaw",
  switch: "Switch",
};

export type GearItem = { slug: string; label: string; disciplines: readonly Discipline[] };

const STRIKING: readonly Discipline[] = ["muay_thai", "boxing"];
const GRAPPLING: readonly Discipline[] = ["bjj_gi", "bjj_nogi"];

export const GEAR: readonly GearItem[] = [
  { slug: "16oz_gloves", label: "16oz gloves", disciplines: STRIKING },
  { slug: "14oz_gloves", label: "14oz gloves", disciplines: STRIKING },
  { slug: "hand_wraps", label: "Hand wraps", disciplines: STRIKING },
  { slug: "shin_guards", label: "Shin guards", disciplines: ["muay_thai"] },
  { slug: "headgear", label: "Headgear", disciplines: STRIKING },
  { slug: "mouthguard", label: "Mouthguard", disciplines: [...STRIKING, ...GRAPPLING] },
  { slug: "groin_guard", label: "Groin guard", disciplines: STRIKING },
  { slug: "gi", label: "Gi", disciplines: ["bjj_gi"] },
  { slug: "rash_guard", label: "Rash guard", disciplines: GRAPPLING },
  { slug: "running_shoes", label: "Running shoes", disciplines: ["running"] },
  { slug: "hydration_vest", label: "Hydration vest", disciplines: ["running"] },
];

export const GEAR_LABELS: Record<string, string> = Object.fromEntries(GEAR.map((g) => [g.slug, g.label]));

export const CHAT_PRESETS: readonly string[] = [
  "Bringing 16oz gloves",
  "Splitting drop-in fee",
  "Running 10 min late",
  "On my way",
  "Can we keep it light?",
];

export const RADIUS_OPTIONS_KM: readonly number[] = [1, 3, 5, 10, 20, 30];

export const WEIGHT_TOLERANCE_OPTIONS_KG: readonly (number | null)[] = [null, 3, 5, 10];

/** Used when location permission is denied or unavailable (Kyiv city centre). */
export const FALLBACK_COORDS = { latitude: 50.4501, longitude: 30.5234 } as const;

export const BRAND_COLOR = "#E11D48";
