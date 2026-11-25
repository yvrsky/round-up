import { create } from "zustand";

import type { Discipline, Intensity } from "@/types/models";

type FilterState = {
  radiusKm: number;
  discipline: Discipline | null;
  intensity: Intensity | null;
  /** Only show creators within ±N kg of the viewer's weight; null = any size. */
  weightToleranceKg: number | null;
  setRadiusKm: (radiusKm: number) => void;
  setDiscipline: (discipline: Discipline | null) => void;
  setIntensity: (intensity: Intensity | null) => void;
  setWeightToleranceKg: (weightToleranceKg: number | null) => void;
  reset: () => void;
};

export const DEFAULT_FILTERS = {
  radiusKm: 10,
  discipline: null,
  intensity: null,
  weightToleranceKg: null,
} as const satisfies Pick<FilterState, "radiusKm" | "discipline" | "intensity" | "weightToleranceKg">;

export const useFilterStore = create<FilterState>()((set) => ({
  ...DEFAULT_FILTERS,
  setRadiusKm: (radiusKm) => set({ radiusKm: Math.min(30, Math.max(1, radiusKm)) }),
  setDiscipline: (discipline) => set({ discipline }),
  setIntensity: (intensity) => set({ intensity }),
  setWeightToleranceKg: (weightToleranceKg) => set({ weightToleranceKg }),
  reset: () => set(DEFAULT_FILTERS),
}));

/** Number of filters that differ from the defaults (for the filter button badge). */
export function useActiveFilterCount(): number {
  return useFilterStore(
    (s) =>
      Number(s.radiusKm !== DEFAULT_FILTERS.radiusKm) +
      Number(s.discipline !== null) +
      Number(s.intensity !== null) +
      Number(s.weightToleranceKg !== null)
  );
}
