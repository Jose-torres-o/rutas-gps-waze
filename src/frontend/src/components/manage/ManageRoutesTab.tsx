import type { Route } from "@/backend";
import { DeleteConfirmDialog } from "@/components/manage/DeleteConfirmDialog";
import { EditRouteDialog } from "@/components/manage/EditRouteDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteRoute, useRoutes } from "@/hooks/use-backend";
import { travelModeMeta } from "@/lib/constants";
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  timestampToDate,
} from "@/lib/format";
import { Pencil, Route as RouteIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SKELETON_IDS = Array.from({ length: 3 }, (_, i) => `route-skeleton-${i}`);

/** Routes tab: list, edit and delete saved routes. */
export function ManageRoutesTab() {
  const { data: routes = [], isLoading } = useRoutes();
  const deleteRoute = useDeleteRoute();
  const [editing, setEditing] = useState<Route | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Route | null>(null);

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteRoute.mutate(target.id, {
      onSuccess: () => {
        toast.success("Route deleted.");
        setPendingDelete(null);
      },
      onError: () => toast.error("Could not delete the route."),
    });
  };

  if (isLoading) {
    return (
      <div
        data-ocid="manage.routes.loading_state"
        className="flex flex-col gap-3"
      >
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div
        data-ocid="manage.routes.empty_state"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <RouteIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-semibold text-foreground">
          No saved routes
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Record a route from the map, then come back here to rename it or
          change its travel mode.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul data-ocid="manage.routes.list" className="flex flex-col gap-3">
        {routes.map((route, index) => {
          const meta = travelModeMeta(route.mode);
          return (
            <li
              key={route.id.toString()}
              data-ocid={`manage.routes.item.${index + 1}`}
              className="rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {route.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {meta.label} ·{" "}
                    {formatDateTime(timestampToDate(route.startedAt))}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {meta.label}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Distance
                  </dt>
                  <dd className="telemetry text-sm font-semibold text-primary">
                    {formatDistance(route.distanceMeters)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Duration
                  </dt>
                  <dd className="telemetry text-sm font-semibold text-foreground">
                    {formatDuration(Number(route.durationSeconds))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Points
                  </dt>
                  <dd className="telemetry text-sm font-semibold text-foreground">
                    {route.points.length}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-ocid={`manage.routes.edit_button.${index + 1}`}
                  onClick={() => setEditing(route)}
                  className="h-8 px-3 text-xs"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-ocid={`manage.routes.delete_button.${index + 1}`}
                  onClick={() => setPendingDelete(route)}
                  className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <EditRouteDialog
        route={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this route?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” and its recorded track will be permanently removed. This cannot be undone.`
            : ""
        }
        pending={deleteRoute.isPending}
        onConfirm={handleConfirmDelete}
        ocid="manage.route_delete_dialog"
      />
    </>
  );
}
