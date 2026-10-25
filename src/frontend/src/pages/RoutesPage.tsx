import type { Route } from "@/backend";
import { LiveNavigationPanel } from "@/components/navigation/LiveNavigationPanel";
import { RouteDetail } from "@/components/routes/RouteDetail";
import { RouteList } from "@/components/routes/RouteList";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoutes } from "@/hooks/use-backend";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  type JoinOption,
  useLiveNavigation,
} from "@/hooks/use-live-navigation";
import { useSetTravelMode, useTravelMode } from "@/hooks/use-travel-mode";
import { TRAVEL_MODES } from "@/lib/constants";
import type { LatLng } from "@/types/app";
import { ArrowLeft, Route as RouteIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface RoutesPageProps {
  /** Return to the full-screen map. */
  onBack: () => void;
  /** Draw the selected route on the map and fit it to bounds. */
  onOpenOnMap: (route: Route) => void;
  /** Live position, forwarded for previews and join computation. */
  marker?: LatLng | null;
}

/**
 * Saved routes management page: browse recorded routes, inspect details,
 * select one for live tracking, and pick a join path when off-route.
 */
export function RoutesPage({
  onBack,
  onOpenOnMap,
  marker = null,
}: RoutesPageProps) {
  const { data: routes = [], isLoading } = useRoutes();
  const { data: travelMode } = useTravelMode();
  const setTravelMode = useSetTravelMode();
  const { fix } = useGeolocation({ watch: true });

  const liveMarker: LatLng | null =
    marker ?? (fix ? { lat: fix.lat, lng: fix.lng } : null);

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [detailRoute, setDetailRoute] = useState<Route | null>(null);
  const [selectedJoinId, setSelectedJoinId] = useState<string | null>(null);

  const mode = travelMode ?? TRAVEL_MODES[0].value;
  const navigation = useLiveNavigation(selectedRoute, mode);

  const handleSelect = useCallback(
    (route: Route) => {
      setSelectedRoute(route);
      setSelectedJoinId(null);
      onOpenOnMap(route);
    },
    [onOpenOnMap],
  );

  const handleSelectJoin = useCallback((option: JoinOption) => {
    setSelectedJoinId(option.id);
  }, []);

  const handleModeChange = useCallback(
    (next: string) => {
      setTravelMode.mutate(next as (typeof TRAVEL_MODES)[number]["value"], {
        onError: () => toast.error("Could not save your travel mode."),
      });
    },
    [setTravelMode],
  );

  const handleDeleted = useCallback(() => {
    setSelectedRoute((current) =>
      current && current.id === detailRoute?.id ? null : current,
    );
    setDetailRoute(null);
  }, [detailRoute]);

  return (
    <div
      data-ocid="routes.page"
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background"
    >
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          data-ocid="routes.back_button"
          aria-label="Back to map"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold text-foreground">
            Saved routes
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Select a route to track your live progress along it
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <RouteIcon className="size-4" aria-hidden="true" />
        </span>
      </header>

      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <label
          htmlFor="routes-page-mode"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Travel mode
        </label>
        <Select value={mode} onValueChange={handleModeChange}>
          <SelectTrigger
            id="routes-page-mode"
            data-ocid="routes.mode_select"
            className="ml-auto w-40"
          >
            <SelectValue placeholder="Choose a mode" />
          </SelectTrigger>
          <SelectContent>
            {TRAVEL_MODES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <RouteList
          routes={routes}
          selectedId={selectedRoute?.id ?? null}
          loading={isLoading}
          marker={liveMarker}
          onSelect={handleSelect}
          onOpenDetail={setDetailRoute}
        />
      </div>

      {selectedRoute && (
        <LiveNavigationPanel
          route={selectedRoute}
          mode={mode}
          navigation={navigation}
          selectedJoinId={selectedJoinId}
          onSelectJoin={handleSelectJoin}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      <RouteDetail
        route={detailRoute}
        open={detailRoute !== null}
        onClose={() => setDetailRoute(null)}
        marker={liveMarker}
        joinPoints={
          detailRoute && selectedRoute && detailRoute.id === selectedRoute.id
            ? (navigation.joinOptions.find((o) => o.id === selectedJoinId)
                ?.points ?? undefined)
            : undefined
        }
        onDeleted={handleDeleted}
      />
    </div>
  );
}
