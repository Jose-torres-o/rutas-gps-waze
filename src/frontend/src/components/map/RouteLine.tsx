import { project } from "@/lib/geo";
import type { LatLng } from "@/types/app";

interface RouteLineProps {
  points: LatLng[];
  center: LatLng;
  zoom: number;
  size: { width: number; height: number };
  /** Draw the animated glow used for the route being recorded. */
  active?: boolean;
}

/**
 * Renders a route polyline as an SVG overlay in screen space. The path is
 * projected from geographic coordinates on every render so it tracks pan/zoom.
 */
export function RouteLine({
  points,
  center,
  zoom,
  size,
  active = false,
}: RouteLineProps) {
  if (size.width === 0 || size.height === 0 || points.length < 2) return null;

  const centerPx = project(center.lat, center.lng, zoom);
  const d = points
    .map((point, index) => {
      const px = project(point.lat, point.lng, zoom);
      const x = px.x - centerPx.x + size.width / 2;
      const y = px.y - centerPx.y + size.height / 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      data-ocid="map.route_line"
      className="pointer-events-none absolute inset-0 z-10"
      width={size.width}
      height={size.height}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="oklch(var(--primary))"
        strokeWidth={active ? 10 : 7}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.28}
      />
      <path
        d={d}
        fill="none"
        stroke="oklch(var(--primary))"
        strokeWidth={active ? 4 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "route-glow" : undefined}
      />
    </svg>
  );
}
