import { type Route, TravelMode } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateRoute } from "@/hooks/use-backend";
import { TRAVEL_MODES } from "@/lib/constants";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditRouteDialogProps {
  route: Route | null;
  onOpenChange: (open: boolean) => void;
}

/** Rename a saved route and change its travel mode. */
export function EditRouteDialog({ route, onOpenChange }: EditRouteDialogProps) {
  const updateRoute = useUpdateRoute();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<TravelMode>(TravelMode.car);

  /* Seed the draft once per opened route; never overwrite while typing. */
  useEffect(() => {
    if (!route) return;
    setName(route.name);
    setMode(route.mode);
  }, [route]);

  const open = route !== null;
  const trimmed = name.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!route) return;
    if (!trimmed) {
      toast.error("Route name cannot be empty.");
      return;
    }
    updateRoute.mutate(
      { id: route.id, update: { name: trimmed, mode } },
      {
        onSuccess: () => {
          toast.success("Route updated.");
          onOpenChange(false);
        },
        onError: () => toast.error("Could not update the route."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="manage.route_dialog"
        className="surface-glass gap-5 border-border sm:max-w-md"
      >
        <DialogHeader className="gap-2">
          <DialogTitle className="font-display text-lg">Edit route</DialogTitle>
          <DialogDescription>
            Update the route name or the travel mode it was recorded with.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="route-name">Route name</Label>
            <Input
              id="route-name"
              value={name}
              data-ocid="manage.route_name_input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Morning commute"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="route-mode">Travel mode</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as TravelMode)}
            >
              <SelectTrigger
                id="route-mode"
                data-ocid="manage.route_mode_select"
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="manage.route_dialog.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="manage.route_dialog.save_button"
              disabled={updateRoute.isPending || trimmed === ""}
            >
              {updateRoute.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
