import { project } from "@/lib/geo";
import type { GeoFix } from "@/types/app";
import { Navigation } from "lucide-react";

interface UserMarkerProps {
  fix: GeoFix;
  center: { lat: number; lng: number };
  zoom: number;
  size: { width: number; height: number };
  follow: boolean;
}

/**
 * Heading-aware live position marker. Rendered in screen space so it stays
 * crisp and always points along the device's current bearing.
 */
export function UserMarker({
  fix,
  center,
  zoom,
  size,
  follow,
}: UserMarkerProps) {
  if (size.width === 0 || size.height === 0) return null;
  const centerPx = project(center.lat, center.lng, zoom);
  const pointPx = project(fix.lat, fix.lng, zoom);
  const left = pointPx.x - centerPx.x + size.width / 2;
  const top = pointPx.y - centerPx.y + size.height / 2;

  const heading = fix.heading ?? 0;

  return (
    <div
      data-ocid="map.map_marker"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
    >
      <div className="relative flex size-14 items-center justify-center">
        <span
          className="absolute size-14 rounded-full bg-primary/25 animate-pulse-ring"
          aria-hidden="true"
        />
        <span
          className="absolute size-9 rounded-full border border-primary/40 bg-primary/10"
          aria-hidden="true"
        />
        <span
          className="relative flex size-8 items-center justify-center rounded-full bg-primary shadow-panel ring-2 ring-background"
          style={{ transform: `rotate(${heading}deg)` }}
        >
          <Navigation
            className="size-4 text-primary-foreground"
            fill="currentColor"
            aria-hidden="true"
          />
        </span>
      </div>
      {!follow && <span className="sr-only">Your live position</span>}
    </div>
  );
}
