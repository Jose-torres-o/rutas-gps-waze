import type { Route } from "@/backend";
import { RouteMiniMap } from "@/components/routes/RouteMiniMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { travelModeMeta } from "@/lib/constants";
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  timestampToDate,
} from "@/lib/format";
import type { LatLng } from "@/types/app";
import { ChevronRight, MapPin } from "lucide-react";

interface RouteCardProps {
  route: Route;
  index: number;
  selected: boolean;
  /** Live position, plotted on the preview when available. */
  marker?: LatLng | null;
  onSelect: (route: Route) => void;
  onOpenDetail: (route: Route) => void;
}

/** A saved route summary card with a mini-map preview and key stats. */
export function RouteCard({
  route,
  index,
  selected,
  marker = null,
  onSelect,
  onOpenDetail,
}: RouteCardProps) {
  const meta = travelModeMeta(route.mode);
  const points: LatLng[] = route.points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
  }));

  return (
    <li
      data-ocid={`routes.item.${index + 1}`}
      className={`overflow-hidden rounded-xl border transition-colors ${
        selected
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-background/40 hover:border-primary/30"
      }`}
    >
      <button
        type="button"
        data-ocid={`routes.select_button.${index + 1}`}
        onClick={() => onSelect(route)}
        aria-pressed={selected}
        className="flex w-full flex-col gap-3 p-3 text-left"
      >
        <RouteMiniMap
          points={points}
          marker={marker}
          width={320}
          height={104}
          className="w-full"
        />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-foreground">
              {route.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {formatDateTime(timestampToDate(route.startedAt))}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] uppercase tracking-wider"
          >
            {meta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Distance
            </p>
            <p className="telemetry text-sm font-semibold text-primary">
              {formatDistance(route.distanceMeters)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="telemetry text-sm font-semibold text-foreground">
              {formatDuration(Number(route.durationSeconds))}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Points
            </p>
            <p className="telemetry text-sm font-semibold text-foreground">
              {route.points.length}
            </p>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-end border-t border-border/60 px-3 py-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-ocid={`routes.detail_button.${index + 1}`}
          onClick={() => onOpenDetail(route)}
          className="h-7 px-2 text-xs"
        >
          Details
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
