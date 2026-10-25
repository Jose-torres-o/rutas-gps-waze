import type { Route } from "@/backend";
import { RouteMiniMap } from "@/components/routes/RouteMiniMap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDeleteRoute } from "@/hooks/use-backend";
import { travelModeMeta } from "@/lib/constants";
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  timestampToDate,
} from "@/lib/format";
import type { LatLng } from "@/types/app";
import { Clock, Gauge, MapPin, Route as RouteIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RouteDetailProps {
  route: Route | null;
  open: boolean;
  onClose: () => void;
  marker?: LatLng | null;
  /** Optional join path drawn in the accent colour on the preview. */
  joinPoints?: LatLng[];
  onDeleted: () => void;
}

interface StatProps {
  icon: typeof Clock;
  label: string;
  value: string;
}

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background/40 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="telemetry truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

/** Full route detail: preview, stats, and a guarded delete action. */
export function RouteDetail({
  route,
  open,
  onClose,
  marker = null,
  joinPoints,
  onDeleted,
}: RouteDetailProps) {
  const deleteRoute = useDeleteRoute();

  if (!route) return null;

  const meta = travelModeMeta(route.mode);
  const points: LatLng[] = route.points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
  }));
  const avgSpeed =
    route.durationSeconds > 0n
      ? route.distanceMeters / Number(route.durationSeconds)
      : 0;

  const handleDelete = () => {
    deleteRoute.mutate(route.id, {
      onSuccess: () => {
        toast.success("Route deleted.");
        onDeleted();
        onClose();
      },
      onError: () => toast.error("Could not delete the route."),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        data-ocid="route_detail.sheet"
        className="max-h-[85dvh] gap-0 rounded-t-2xl border-border bg-card p-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[26rem] sm:max-w-md sm:rounded-none sm:border-l"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate font-display text-lg">
                {route.name}
              </SheetTitle>
              <SheetDescription className="mt-1">
                Recorded {formatDateTime(timestampToDate(route.startedAt))}
              </SheetDescription>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px] uppercase tracking-wider"
            >
              {meta.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <RouteMiniMap
            points={points}
            marker={marker}
            joinPoints={joinPoints}
            width={320}
            height={160}
            className="w-full"
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat
              icon={RouteIcon}
              label="Distance"
              value={formatDistance(route.distanceMeters)}
            />
            <Stat
              icon={Clock}
              label="Duration"
              value={formatDuration(Number(route.durationSeconds))}
            />
            <Stat
              icon={Gauge}
              label="Avg speed"
              value={`${Math.round(avgSpeed * 3.6)} km/h`}
            />
            <Stat
              icon={MapPin}
              label="Track points"
              value={String(route.points.length)}
            />
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Start
            </p>
            <p className="telemetry text-xs text-foreground">
              {points[0]
                ? `${points[0].lat.toFixed(5)}, ${points[0].lng.toFixed(5)}`
                : "—"}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              End
            </p>
            <p className="telemetry text-xs text-foreground">
              {points.length > 0
                ? `${points[points.length - 1].lat.toFixed(5)}, ${points[points.length - 1].lng.toFixed(5)}`
                : "—"}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="route_detail.close_button"
              onClick={onClose}
              className="w-full"
            >
              Back to routes
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  data-ocid="route_detail.delete_button"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete route
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="route_detail.delete_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this route?</AlertDialogTitle>
                  <AlertDialogDescription>
                    “{route.name}” and its recorded track will be permanently
                    removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    type="button"
                    data-ocid="route_detail.cancel_button"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    data-ocid="route_detail.confirm_button"
                    disabled={deleteRoute.isPending}
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteRoute.isPending ? "Deleting…" : "Delete route"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
