import type { TravelMode } from "@/backend";
import { travelModeMeta } from "@/lib/constants";
import { formatRelative, formatSpeed } from "@/lib/format";
import type { GeoFix, GpsStatus } from "@/types/app";
import {
  Bike,
  Bus,
  Car,
  Footprints,
  Navigation,
  Satellite,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
} from "lucide-react";

interface StatusStripProps {
  mode: TravelMode;
  status: GpsStatus;
  fix: GeoFix | null;
  error: string | null;
}

const MODE_ICONS = {
  car: Car,
  bus: Bus,
  motorcycle: Navigation,
  bicycle: Bike,
  walking: Footprints,
} as const;

function GpsIndicator({
  status,
  accuracy,
}: { status: GpsStatus; accuracy?: number }) {
  if (status === "live") {
    const Icon =
      accuracy !== undefined && accuracy <= 15
        ? SignalHigh
        : accuracy !== undefined && accuracy <= 40
          ? SignalMedium
          : SignalLow;
    return <Icon className="size-4 text-success" aria-hidden="true" />;
  }
  if (status === "locating") {
    return (
      <SignalMedium
        className="size-4 animate-pulse text-warning"
        aria-hidden="true"
      />
    );
  }
  return (
    <SignalZero className="size-4 text-muted-foreground" aria-hidden="true" />
  );
}

const STATUS_LABEL: Record<GpsStatus, string> = {
  idle: "GPS idle",
  locating: "Acquiring GPS",
  live: "GPS live",
  denied: "GPS blocked",
  unavailable: "GPS unavailable",
};

/** Top telemetry strip: travel mode, GPS state, and last-fix recency. */
export function StatusStrip({ mode, status, fix, error }: StatusStripProps) {
  const meta = travelModeMeta(mode);
  const ModeIcon = MODE_ICONS[meta.icon];
  const lastUpdated = fix ? formatRelative(new Date(fix.timestamp)) : "—";

  return (
    <header
      data-ocid="status.strip"
      className="pointer-events-auto absolute inset-x-3 top-3 z-30 flex items-center gap-2 rounded-2xl surface-glass px-3 py-2 shadow-panel sm:inset-x-4 sm:top-4 sm:gap-3 sm:px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ModeIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Travel mode
          </p>
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {meta.label}
          </p>
        </div>
      </div>

      <span className="mx-1 h-8 w-px bg-border/70" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <GpsIndicator status={status} accuracy={fix?.accuracy} />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {STATUS_LABEL[status]}
          </p>
          <p className="truncate telemetry text-xs text-foreground">
            {status === "live"
              ? `Updated ${lastUpdated}`
              : (error ?? "Waiting for signal")}
          </p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <Satellite
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="telemetry text-xs text-foreground">
          {formatSpeed(fix?.speed ?? null)}
        </span>
      </div>
    </header>
  );
}
