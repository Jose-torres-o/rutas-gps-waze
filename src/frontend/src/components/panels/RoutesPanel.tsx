import type { Route, TravelMode } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDeleteRoute, useUpdateRoute } from "@/hooks/use-backend";
import { TRAVEL_MODES, travelModeMeta } from "@/lib/constants";
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  timestampToDate,
} from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { Pencil, Route as RouteIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RoutesPanelProps {
  open: boolean;
  onClose: () => void;
  routes: Route[];
  selectedId: bigint | null;
  onSelect: (route: Route) => void;
  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;
}

/** Management panel for saved routes plus the travel-mode selector. */
export function RoutesPanel({
  open,
  onClose,
  routes,
  selectedId,
  onSelect,
  mode,
  onModeChange,
}: RoutesPanelProps) {
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [draftName, setDraftName] = useState("");

  const startEdit = (route: Route) => {
    setEditingId(route.id);
    setDraftName(route.name);
  };

  const saveEdit = (route: Route) => {
    const name = draftName.trim();
    if (!name) {
      toast.error("Route name cannot be empty.");
      return;
    }
    updateRoute.mutate(
      { id: route.id, update: { name, mode: route.mode } },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Route renamed.");
        },
        onError: () => toast.error("Could not rename the route."),
      },
    );
  };

  const handleDelete = (route: Route) => {
    deleteRoute.mutate(route.id, {
      onSuccess: () => toast.success("Route deleted."),
      onError: () => toast.error("Could not delete the route."),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        data-ocid="routes.sheet"
        className="max-h-[80dvh] gap-0 rounded-t-2xl border-border bg-card p-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[26rem] sm:max-w-md sm:rounded-none sm:border-l"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-lg">
            Routes &amp; travel mode
          </SheetTitle>
          <SheetDescription>
            Saved tracks from your live recordings. Select one to preview it on
            the map.
          </SheetDescription>
          <Link
            to="/routes"
            data-ocid="routes.live_navigation_link"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <RouteIcon className="size-3.5" aria-hidden="true" />
            Open live navigation
          </Link>
        </SheetHeader>

        <div className="border-b border-border px-5 py-4">
          <label
            htmlFor="travel-mode-select"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Travel mode
          </label>
          <Select
            value={mode}
            onValueChange={(value) => onModeChange(value as TravelMode)}
          >
            <SelectTrigger
              id="travel-mode-select"
              data-ocid="routes.mode_select"
              className="w-full"
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {routes.length === 0 ? (
            <div
              data-ocid="routes.empty_state"
              className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <RouteIcon className="size-6" aria-hidden="true" />
              </span>
              <p className="font-display text-sm font-semibold text-foreground">
                No routes yet
              </p>
              <p className="text-xs text-muted-foreground">
                Tap the record button on the map to capture your first route.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {routes.map((route, index) => {
                const meta = travelModeMeta(route.mode);
                const selected = selectedId !== null && selectedId === route.id;
                const editing = editingId === route.id;
                return (
                  <li
                    key={route.id.toString()}
                    data-ocid={`routes.item.${index + 1}`}
                    className={`rounded-xl border p-3 transition-colors ${
                      selected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background/40 hover:border-primary/30"
                    }`}
                  >
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={draftName}
                          data-ocid={`routes.name_input.${index + 1}`}
                          onChange={(event) => setDraftName(event.target.value)}
                          aria-label="Route name"
                          className="h-8"
                        />
                        <Button
                          type="button"
                          size="sm"
                          data-ocid={`routes.save_button.${index + 1}`}
                          disabled={updateRoute.isPending}
                          onClick={() => saveEdit(route)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          data-ocid={`routes.cancel_button.${index + 1}`}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelect(route)}
                          className="flex w-full items-start justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-semibold text-foreground">
                              {route.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {meta.label} ·{" "}
                              {formatDateTime(timestampToDate(route.startedAt))}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="telemetry text-sm font-semibold text-primary">
                              {formatDistance(route.distanceMeters)}
                            </p>
                            <p className="telemetry text-xs text-muted-foreground">
                              {formatDuration(Number(route.durationSeconds))}
                            </p>
                          </div>
                        </button>
                        <div className="mt-2 flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            data-ocid={`routes.edit_button.${index + 1}`}
                            onClick={() => startEdit(route)}
                            className="h-7 px-2 text-xs"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Rename
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            data-ocid={`routes.delete_button.${index + 1}`}
                            disabled={deleteRoute.isPending}
                            onClick={() => handleDelete(route)}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
