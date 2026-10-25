import { Button } from "@/components/ui/button";
import { formatCoords } from "@/lib/format";
import { MapPin, X } from "lucide-react";

interface SharedLocationBannerProps {
  point: { lat: number; lng: number };
  label: string | null;
  onDismiss: () => void;
}

/**
 * Shown when the app was opened through a shared location link, confirming
 * which point the map is centred on and offering a way to clear it.
 */
export function SharedLocationBanner({
  point,
  label,
  onDismiss,
}: SharedLocationBannerProps) {
  return (
    <output
      data-ocid="share.shared_banner"
      className="surface-glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-panel"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
        <MapPin className="size-4" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {label?.trim() ? label.trim() : "Shared location"}
        </span>
        <span className="telemetry truncate text-xs text-muted-foreground">
          {formatCoords(point.lat, point.lng)}
        </span>
      </div>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-ocid="share.dismiss_banner_button"
        aria-label="Dismiss shared location"
        onClick={onDismiss}
        className="shrink-0"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </output>
  );
}
