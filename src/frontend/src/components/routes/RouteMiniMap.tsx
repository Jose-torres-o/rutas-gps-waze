import { project } from "@/lib/geo";
import type { LatLng } from "@/types/app";
import { useMemo } from "react";

interface RouteMiniMapProps {
  points: LatLng[];
  /** Optional live position to plot on the preview. */
  marker?: LatLng | null;
  /** Optional join path drawn in the accent colour. */
  joinPoints?: LatLng[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Lightweight SVG preview of a route's shape. Fits the path to the viewport
 * with padding so it reads as a thumbnail without a mapping library.
 */
export function RouteMiniMap({
  points,
  marker = null,
  joinPoints,
  width = 320,
  height = 120,
  className,
}: RouteMiniMapProps) {
  const geometry = useMemo(() => {
    const all =
      joinPoints && joinPoints.length > 0 ? [...points, ...joinPoints] : points;
    if (all.length < 2) return null;

    /* Project at a fixed zoom, then normalise into the viewport box. */
    const projected = all.map((p) => project(p.lat, p.lng, 12));
    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const pad = 10;
    const scale = Math.min(
      (width - pad * 2) / spanX,
      (height - pad * 2) / spanY,
    );
    const offsetX = (width - spanX * scale) / 2;
    const offsetY = (height - spanY * scale) / 2;

    const toScreen = (p: LatLng) => {
      const px = project(p.lat, p.lng, 12);
      return {
        x: (px.x - minX) * scale + offsetX,
        y: (px.y - minY) * scale + offsetY,
      };
    };

    const toPath = (list: LatLng[]) =>
      list
        .map((p, i) => {
          const s = toScreen(p);
          return `${i === 0 ? "M" : "L"}${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
        })
        .join(" ");

    return {
      routePath: toPath(points),
      joinPath: joinPoints && joinPoints.length > 1 ? toPath(joinPoints) : null,
      markerScreen: marker ? toScreen(marker) : null,
    };
  }, [points, marker, joinPoints, width, height]);

  if (!geometry) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-border bg-muted/40 text-[10px] text-muted-foreground ${className ?? ""}`}
        style={{ width, height }}
      >
        No path data
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`rounded-lg border border-border bg-[oklch(0.13_0.012_235)] ${className ?? ""}`}
      aria-hidden="true"
    >
      {geometry.joinPath && (
        <path
          d={geometry.joinPath}
          fill="none"
          stroke="oklch(var(--accent))"
          strokeWidth={2}
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <path
        d={geometry.routePath}
        fill="none"
        stroke="oklch(var(--primary))"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {geometry.markerScreen && (
        <circle
          cx={geometry.markerScreen.x}
          cy={geometry.markerScreen.y}
          r={4}
          fill="oklch(var(--accent))"
          stroke="oklch(var(--background))"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
