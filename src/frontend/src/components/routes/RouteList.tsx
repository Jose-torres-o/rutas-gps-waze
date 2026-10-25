import type { Route } from "@/backend";
import { RouteCard } from "@/components/routes/RouteCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { LatLng } from "@/types/app";
import { Route as RouteIcon } from "lucide-react";

interface RouteListProps {
  routes: Route[];
  selectedId: bigint | null;
  loading: boolean;
  marker?: LatLng | null;
  onSelect: (route: Route) => void;
  onOpenDetail: (route: Route) => void;
}

const SKELETON_IDS = Array.from({ length: 3 }, (_, i) => `route-skeleton-${i}`);

/** Scrollable list of saved routes with loading and empty states. */
export function RouteList({
  routes,
  selectedId,
  loading,
  marker = null,
  onSelect,
  onOpenDetail,
}: RouteListProps) {
  if (loading) {
    return (
      <div data-ocid="routes.loading_state" className="flex flex-col gap-3">
        {SKELETON_IDS.map((id) => (
          <div
            key={id}
            className="flex flex-col gap-3 rounded-xl border border-border p-3"
          >
            <Skeleton className="h-[104px] w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div
        data-ocid="routes.empty_state"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <RouteIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-semibold text-foreground">
          No saved routes yet
        </p>
        <p className="text-xs text-muted-foreground">
          Record a route from the map, then select it here to track your live
          progress along it.
        </p>
      </div>
    );
  }

  return (
    <ul data-ocid="routes.list" className="flex flex-col gap-3">
      {routes.map((route, index) => (
        <RouteCard
          key={route.id.toString()}
          route={route}
          index={index}
          selected={selectedId !== null && selectedId === route.id}
          marker={marker}
          onSelect={onSelect}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </ul>
  );
}
