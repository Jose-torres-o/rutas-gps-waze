import { OSM_TILE_URL, TILE_SIZE } from "@/lib/constants";
import { project, unproject } from "@/lib/geo";
import type { LatLng } from "@/types/app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MapViewProps {
  center: LatLng;
  zoom: number;
  /** When true the map follows `center` as it changes. */
  follow: boolean;
  onCenterChange: (center: LatLng) => void;
  onZoomChange: (zoom: number) => void;
  onUserPan: () => void;
  children?: React.ReactNode;
}

interface Tile {
  key: string;
  url: string;
  left: number;
  top: number;
}

const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Full-bleed OpenStreetMap raster map. Tiles are positioned in a transformed
 * layer so panning and zooming stay smooth without a mapping library.
 */
export function MapView({
  center,
  zoom,
  follow,
  onCenterChange,
  onZoomChange,
  onUserPan,
  children,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const dragRef = useRef<{ x: number; y: number; center: LatLng } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const centerPx = useMemo(
    () => project(center.lat, center.lng, zoom),
    [center.lat, center.lng, zoom],
  );

  const tiles = useMemo<Tile[]>(() => {
    if (size.width === 0 || size.height === 0) return [];
    const halfW = size.width / 2;
    const halfH = size.height / 2;
    const minX = Math.floor((centerPx.x - halfW) / TILE_SIZE);
    const maxX = Math.floor((centerPx.x + halfW) / TILE_SIZE);
    const minY = Math.floor((centerPx.y - halfH) / TILE_SIZE);
    const maxY = Math.floor((centerPx.y + halfH) / TILE_SIZE);
    const maxIndex = 2 ** zoom;
    const result: Tile[] = [];
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        if (y < 0 || y >= maxIndex) continue;
        const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
        result.push({
          key: `${zoom}/${x}/${y}`,
          url: OSM_TILE_URL.replace("{z}", String(zoom))
            .replace("{x}", String(wrappedX))
            .replace("{y}", String(y)),
          left: x * TILE_SIZE - centerPx.x + halfW,
          top: y * TILE_SIZE - centerPx.y + halfH,
        });
      }
    }
    return result;
  }, [centerPx.x, centerPx.y, size.width, size.height, zoom]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      dragRef.current = { x: event.clientX, y: event.clientY, center };
      setDragging(true);
    },
    [center],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const startPx = project(drag.center.lat, drag.center.lng, zoom);
      const next = unproject(startPx.x - dx, startPx.y - dy, zoom);
      onCenterChange(next);
    },
    [onCenterChange, zoom],
  );

  const endDrag = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      onUserPan();
    }
  }, [onUserPan]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -1 : 1;
      onZoomChange(clampZoom(zoom + delta));
    },
    [onZoomChange, zoom],
  );

  return (
    <div
      ref={containerRef}
      data-ocid="map.canvas_target"
      className="absolute inset-0 overflow-hidden bg-[oklch(0.13_0.012_235)] touch-none select-none"
      style={{ cursor: dragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={handleWheel}
    >
      <div className="absolute inset-0">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute opacity-90 [filter:invert(0.92)_hue-rotate(180deg)_brightness(0.85)_contrast(0.9)]"
            style={{
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          />
        ))}
      </div>
      {children}
      {!follow && (
        <div className="pointer-events-none absolute inset-0 bg-background/10" />
      )}
    </div>
  );
}
