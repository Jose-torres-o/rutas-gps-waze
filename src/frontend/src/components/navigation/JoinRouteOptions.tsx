import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { JoinOption } from "@/hooks/use-live-navigation";
import { formatDistance, formatDuration } from "@/lib/format";
import { AlertTriangle, Navigation, Route as RouteIcon } from "lucide-react";

interface JoinRouteOptionsProps {
  options: JoinOption[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (option: JoinOption) => void;
}

const SKELETON_IDS = Array.from({ length: 2 }, (_, i) => `join-skeleton-${i}`);

/**
 * Off-route recovery: shortest paths from the live position back onto the
 * selected route, each with distance and estimated time.
 */
export function JoinRouteOptions({
  options,
  selectedId,
  loading,
  error,
  onSelect,
}: JoinRouteOptionsProps) {
  if (loading) {
    return (
      <div data-ocid="join.loading_state" className="flex flex-col gap-2">
        {SKELETON_IDS.map((id) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <Skeleton className="size-9 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-ocid="join.error_state"
        className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div
        data-ocid="join.empty_state"
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center"
      >
        <RouteIcon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-xs text-muted-foreground">
          No join route available from your current position.
        </p>
      </div>
    );
  }

  return (
    <ul data-ocid="join.list" className="flex flex-col gap-2">
      {options.map((option, index) => {
        const selected = selectedId === option.id;
        return (
          <li key={option.id}>
            <Button
              type="button"
              variant="ghost"
              data-ocid={`join.option.${index + 1}`}
              aria-pressed={selected}
              onClick={() => onSelect(option)}
              className={`h-auto w-full justify-start gap-3 rounded-lg border px-3 py-2.5 text-left ${
                selected
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-background/40 hover:border-accent/40"
              }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                  selected
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Navigation className="size-4" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {index === 0 ? "Fastest join" : `Alternative ${index}`}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    Rejoin at {Math.round(option.joinFraction * 100)}% of route
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="telemetry block text-sm font-semibold text-accent">
                    {formatDistance(option.distanceMeters)}
                  </span>
                  <span className="telemetry block text-[11px] text-muted-foreground">
                    {formatDuration(option.durationSeconds)}
                  </span>
                </span>
              </span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
