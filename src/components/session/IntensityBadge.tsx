import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { INTENSITY_LABELS } from "@/lib/constants";
import type { Intensity, SessionStatus } from "@/types/models";

const INTENSITY_TONES: Record<Intensity, BadgeTone> = {
  technical_light: "success",
  drills_only: "info",
  moderate: "warning",
  hard_sparring: "danger",
};

export function IntensityBadge({ intensity }: { intensity: Intensity }) {
  return <Badge label={INTENSITY_LABELS[intensity]} tone={INTENSITY_TONES[intensity]} />;
}

const STATUS: Record<SessionStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "info" },
  matched: { label: "Matched", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  return <Badge label={STATUS[status].label} tone={STATUS[status].tone} />;
}
