import type { Route, TravelMode } from "@/backend";
import { JoinRouteOptions } from "@/components/navigation/JoinRouteOptions";
import { ProgressBar } from "@/components/navigation/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  JoinOption,
  LiveNavigationState,
} from "@/hooks/use-live-navigation";
import { travelModeMeta } from "@/lib/constants";
import { formatDistance, formatRelative } from "@/lib/format";
import { CheckCircle2, Compass, Navigation, Radio, X } from "lucide-react";

interface LiveNavigationPanelProps {
  route: Route;
  mode: TravelMode;
  navigation: LiveNavigationState;
  selectedJoinId: string | null;
  onSelectJoin: (option: JoinOption) => void;
  onClose: () => void;
}

/**
 * Live navigation HUD for the selected route: on-route progress or off-route
 * join options, plus a last-updated indicator for the GPS feed.
 */
export function LiveNavigationPanel({
  route,
  mode,
  navigation,
  selectedJoinId,
  onSelectJoin,
  onClose,
}: LiveNavigationPanelProps) {
  const {
    fix,
    tracking,
    onRoute,
    progress,
    joinOptions,
    loadingJoins,
    joinError,
    lastUpdated,
  } = navigation;
  const meta = travelModeMeta(mode);
  const lastLabel = lastUpdated ? formatRelative(new Date(lastUpdated)) : "—";

  return (
    <section
      data-ocid="navigation.panel"
      aria-label="Live navigation"
      className="pointer-events-auto absolute inset-x-3 top-20 z-20 flex max-h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl surface-glass shadow-panel sm:inset-x-auto sm:left-4 sm:top-24 sm:w-[22rem]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Live navigation
          </p>
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {route.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] uppercase tracking-wider"
          >
            {meta.label}
          </Badge>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            data-ocid="navigation.close_button"
            aria-label="Close live navigation"
            onClick={onClose}
            className="size-7"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2">
        <Radio
          className={`size-3.5 ${tracking ? "text-success" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
        <span className="text-[11px] text-muted-foreground">
          {tracking ? "Live position" : "Waiting for GPS"}
        </span>
        <span className="ml-auto telemetry text-[11px] text-muted-foreground">
          Updated {lastLabel}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!fix ? (
          <div
            data-ocid="navigation.waiting_state"
            className="flex flex-col items-center gap-2 py-6 text-center"
          >
            <Compass
              className="size-6 animate-pulse text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              Acquiring your live position…
            </p>
          </div>
        ) : onRoute && progress ? (
          <div
            data-ocid="navigation.on_route_state"
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2">
              <CheckCircle2
                className="size-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-success">
                On route — tracking your progress
              </p>
            </div>

            <ProgressBar
              fraction={progress.fraction}
              traveledMeters={progress.traveledMeters}
              remainingMeters={progress.remainingMeters}
            />

            <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
              <span className="text-[11px] text-muted-foreground">
                Distance from route
              </span>
              <span className="telemetry text-xs text-foreground">
                {formatDistance(progress.offsetMeters)}
              </span>
            </div>
          </div>
        ) : (
          <div
            data-ocid="navigation.off_route_state"
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2">
              <Navigation
                className="size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-accent">
                Off route — choose a path to rejoin
              </p>
            </div>

            <JoinRouteOptions
              options={joinOptions}
              selectedId={selectedJoinId}
              loading={loadingJoins}
              error={joinError}
              onSelect={onSelectJoin}
            />
          </div>
        )}
      </div>
    </section>
  );
}
