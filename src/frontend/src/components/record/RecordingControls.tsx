import { Button } from "@/components/ui/button";
import { CircleDot, Square, Trash2 } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  /** True when a recording cannot start because there is no GPS fix yet. */
  startDisabled: boolean;
  onStart: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

/**
 * Primary record controls docked at the bottom of the map. While idle it shows
 * a single start action; while recording it swaps to stop and discard.
 */
export function RecordingControls({
  isRecording,
  startDisabled,
  onStart,
  onStop,
  onDiscard,
}: RecordingControlsProps) {
  return (
    <div
      data-ocid="record.controls"
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 flex items-center justify-center gap-3 rounded-2xl surface-glass px-4 py-3 shadow-dock sm:inset-x-4 sm:bottom-4"
    >
      {isRecording ? (
        <>
          <Button
            type="button"
            variant="outline"
            data-ocid="record.discard_button"
            onClick={onDiscard}
            className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Discard
          </Button>
          <Button
            type="button"
            data-ocid="record.stop_button"
            onClick={onStop}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:flex-none"
          >
            <Square className="size-4" fill="currentColor" aria-hidden="true" />
            Stop &amp; save
          </Button>
        </>
      ) : (
        <Button
          type="button"
          data-ocid="record.start_button"
          disabled={startDisabled}
          onClick={onStart}
          className="w-full sm:w-auto sm:px-8"
        >
          <CircleDot className="size-4" aria-hidden="true" />
          Start recording
        </Button>
      )}
    </div>
  );
}
