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
import { formatDistance, formatDuration } from "@/lib/format";
import { useEffect, useState } from "react";

interface SaveRouteDialogProps {
  open: boolean;
  /** Suggested name pre-filled when the dialog opens. */
  defaultName: string;
  distanceMeters: number;
  durationSeconds: number;
  isSaving: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}

/**
 * Prompts for a route name once a recording stops, summarising what was
 * captured before it is written to the backend.
 */
export function SaveRouteDialog({
  open,
  defaultName,
  distanceMeters,
  durationSeconds,
  isSaving,
  onSave,
  onCancel,
}: SaveRouteDialogProps) {
  const [name, setName] = useState(defaultName);

  /* Re-seed the draft each time the dialog opens for a new recording. */
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !isSaving;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    onSave(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent data-ocid="record.save_dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Save this route</DialogTitle>
          <DialogDescription>
            Give your recording a name so you can find it later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Distance
            </p>
            <p className="telemetry text-base font-semibold text-primary">
              {formatDistance(distanceMeters)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="telemetry text-base font-semibold text-primary">
              {formatDuration(durationSeconds)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="record-route-name"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Route name
            </label>
            <Input
              id="record-route-name"
              value={name}
              data-ocid="record.name_input"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Morning commute"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              data-ocid="record.cancel_button"
              disabled={isSaving}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="record.save_button"
              disabled={!canSave}
            >
              {isSaving ? "Saving…" : "Save route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
