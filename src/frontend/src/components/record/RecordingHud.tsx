import { formatDistance, formatDuration, formatSpeed } from "@/lib/format";
import { Gauge, Route as RouteIcon, Timer } from "lucide-react";

interface RecordingHudProps {
  /** Seconds elapsed since the recording started. */
  elapsedSeconds: number;
  /** Metres travelled so far. */
  distanceMeters: number;
  /** Current speed in metres per second, or null when unavailable. */
  currentSpeed: number | null;
  /** Number of path points captured so far. */
  pointCount: number;
}

interface HudStat {
  key: string;
  label: string;
  value: string;
  icon: typeof Timer;
  ocid: string;
}

/**
 * Live telemetry readout shown while a route is being recorded: elapsed time,
 * distance travelled, and current speed.
 */
export function RecordingHud({
  elapsedSeconds,
  distanceMeters,
  currentSpeed,
  pointCount,
}: RecordingHudProps) {
  const stats: HudStat[] = [
    {
      key: "duration",
      label: "Duration",
      value: formatDuration(elapsedSeconds),
      icon: Timer,
      ocid: "record.duration",
    },
    {
      key: "distance",
      label: "Distance",
      value: formatDistance(distanceMeters),
      icon: RouteIcon,
      ocid: "record.distance",
    },
    {
      key: "speed",
      label: "Speed",
      value: formatSpeed(currentSpeed),
      icon: Gauge,
      ocid: "record.speed",
    },
  ];

  return (
    <section
      data-ocid="record.hud"
      aria-label="Live recording telemetry"
      className="pointer-events-auto absolute inset-x-3 top-20 z-30 rounded-2xl surface-glass px-4 py-3 shadow-panel sm:inset-x-4 sm:top-24"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex size-2.5" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
        </span>
        <p className="text-[10px] font-medium uppercase tracking-wider text-destructive">
          Recording live
        </p>
        <span className="ml-auto telemetry text-[10px] text-muted-foreground">
          {pointCount} {pointCount === 1 ? "point" : "points"}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              data-ocid={stat.ocid}
              className="flex flex-col gap-1 rounded-xl border border-border/60 bg-background/40 px-3 py-2"
            >
              <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Icon className="size-3.5" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="telemetry text-lg font-semibold leading-none text-foreground">
                {stat.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
