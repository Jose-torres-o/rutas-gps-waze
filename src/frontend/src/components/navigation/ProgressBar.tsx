import { Progress } from "@/components/ui/progress";
import { formatDistance } from "@/lib/format";

interface ProgressBarProps {
  /** Fraction travelled, 0–1. */
  fraction: number;
  traveledMeters: number;
  remainingMeters: number;
  /** Optional ocid suffix so multiple bars stay uniquely addressable. */
  ocid?: string;
}

/**
 * Live travelled-progress indicator: a filled track plus travelled and
 * remaining distance readouts.
 */
export function ProgressBar({
  fraction,
  traveledMeters,
  remainingMeters,
  ocid = "navigation.progress",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const percent = Math.round(clamped * 100);

  return (
    <div data-ocid={ocid} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Route progress
        </span>
        <span className="telemetry text-sm font-semibold text-primary">
          {percent}%
        </span>
      </div>

      <Progress
        value={percent}
        aria-label="Travelled progress along the route"
        className="h-2 bg-muted"
      />

      <div className="flex items-center justify-between text-xs">
        <span className="telemetry text-muted-foreground">
          <span className="text-foreground">
            {formatDistance(traveledMeters)}
          </span>{" "}
          travelled
        </span>
        <span className="telemetry text-muted-foreground">
          <span className="text-foreground">
            {formatDistance(remainingMeters)}
          </span>{" "}
          left
        </span>
      </div>
    </div>
  );
}
