import { type Tag, TravelMode } from "@/backend";
import { StatusStrip } from "@/components/layout/StatusStrip";
import { MapControls } from "@/components/map/MapControls";
import { MapView } from "@/components/map/MapView";
import { TagMarkers } from "@/components/map/TagMarkers";
import { UserMarker } from "@/components/map/UserMarker";
import { TagFormDialog } from "@/components/tags/TagFormDialog";
import { TagList } from "@/components/tags/TagList";
import { TagPlacementBanner } from "@/components/tags/TagPlacementBanner";
import { Button } from "@/components/ui/button";
import { useTags } from "@/hooks/use-backend";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useTagPlacement } from "@/hooks/use-tag-placement";
import { useTravelMode } from "@/hooks/use-travel-mode";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/lib/constants";
import { project, unproject } from "@/lib/geo";
import type { LatLng, MapLayer } from "@/types/app";
import { Crosshair, MapPin, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LAYERS: Record<MapLayer, boolean> = {
  route: false,
  tags: true,
  signals: true,
};

/**
 * Street tags and notes workspace: tap the map to pin a tag, manage the full
 * collection in the side panel, and toggle signal markers on the map.
 */
export function TagsPage() {
  const { fix, status, error, request } = useGeolocation({ watch: true });
  const { data: tags = [] } = useTags();
  const { data: travelMode } = useTravelMode();
  const placement = useTagPlacement();

  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [follow, setFollow] = useState(true);
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>(LAYERS);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });

  const mapWrapRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const tapRef = useRef<{ x: number; y: number } | null>(null);

  /* Track the map container size for overlay projection. */
  useEffect(() => {
    const el = mapWrapRef.current;
    if (!el) return;
    const update = () =>
      setMapSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Follow the live fix until the user pans away. */
  useEffect(() => {
    if (!fix) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      setCenter({ lat: fix.lat, lng: fix.lng });
      return;
    }
    if (follow) setCenter({ lat: fix.lat, lng: fix.lng });
  }, [fix, follow]);

  const handleCenterChange = useCallback((next: LatLng) => {
    setCenter(next);
  }, []);

  const handleUserPan = useCallback(() => {
    setFollow(false);
  }, []);

  const handleLocate = useCallback(() => {
    setFollow(true);
    if (fix) setCenter({ lat: fix.lat, lng: fix.lng });
    else request();
  }, [fix, request]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - 1));
  }, []);

  const handleToggleLayer = useCallback((layer: MapLayer) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }, []);

  /* Capture a tap (not a drag) and convert it to a map coordinate. */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      tapRef.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const start = tapRef.current;
      tapRef.current = null;
      if (!start) return;
      const moved =
        Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y);
      if (moved > 6) return;
      if (!placement.armed) return;
      const el = mapWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerPx = project(center.lat, center.lng, zoom);
      const worldX = centerPx.x + (event.clientX - rect.left) - rect.width / 2;
      const worldY = centerPx.y + (event.clientY - rect.top) - rect.height / 2;
      placement.placeAt(unproject(worldX, worldY, zoom));
    },
    [center.lat, center.lng, placement, zoom],
  );

  const handleFocusTag = useCallback((tag: Tag) => {
    setSelectedTag(tag);
    setCenter({ lat: tag.lat, lng: tag.lng });
    setFollow(false);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingTag(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setFormOpen(true);
  }, []);

  const visibleTags = useMemo(
    () =>
      layers.tags
        ? tags.filter(
            (tag) => layers.signals || tag.category !== "trafficSignal",
          )
        : [],
    [layers.signals, layers.tags, tags],
  );

  const defaultPoint: LatLng = fix ? { lat: fix.lat, lng: fix.lng } : center;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the map is a pointer surface; keyboard users place tags via the "At centre" button */}
      <div
        ref={mapWrapRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <MapView
          center={center}
          zoom={zoom}
          follow={follow}
          onCenterChange={handleCenterChange}
          onZoomChange={setZoom}
          onUserPan={handleUserPan}
        >
          {visibleTags.length > 0 && (
            <TagMarkers
              tags={visibleTags}
              center={center}
              zoom={zoom}
              size={mapSize}
              selectedId={selectedTag?.id ?? null}
              onSelect={handleFocusTag}
            />
          )}
          {fix && (
            <UserMarker
              fix={fix}
              center={center}
              zoom={zoom}
              size={mapSize}
              follow={follow}
            />
          )}
        </MapView>
      </div>

      <StatusStrip
        mode={travelMode ?? TravelMode.car}
        status={status}
        fix={fix}
        error={error}
      />

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        locating={status === "locating"}
      />

      {placement.armed && !placement.pendingPoint && (
        <div
          data-ocid="tags.placement_hint"
          className="pointer-events-none absolute inset-x-3 top-24 z-30 flex justify-center sm:top-28"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full surface-glass px-3 py-1.5 shadow-panel">
            <span className="text-xs font-medium text-foreground">
              Tap the map to pin a tag
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-ocid="tags.place_center_button"
              onClick={() => placement.placeAt(center)}
              className="h-7 rounded-full px-2.5 text-xs"
            >
              <Crosshair className="size-3.5" aria-hidden="true" />
              At centre
            </Button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex items-center justify-between gap-2 sm:inset-x-4 sm:bottom-4">
        <Button
          type="button"
          data-ocid="tags.place_toggle"
          aria-pressed={placement.armed}
          onClick={placement.toggleArmed}
          className={`pointer-events-auto rounded-full shadow-panel ${
            placement.armed
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {placement.armed ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            <MapPin className="size-4" aria-hidden="true" />
          )}
          {placement.armed ? "Stop placing" : "Place tag"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          data-ocid="tags.open_list_button"
          onClick={() => setListOpen(true)}
          className="pointer-events-auto rounded-full shadow-panel"
        >
          <Plus className="size-4" aria-hidden="true" />
          Manage tags
          <span className="telemetry ml-1 rounded-full bg-background/60 px-1.5 text-[11px]">
            {tags.length}
          </span>
        </Button>
      </div>

      <TagPlacementBanner
        point={placement.pendingPoint}
        category={placement.category}
        note={placement.note}
        saving={placement.saving}
        onCategoryChange={placement.setCategory}
        onNoteChange={placement.setNote}
        onSave={placement.save}
        onCancel={placement.cancel}
      />

      {listOpen && (
        <aside
          data-ocid="tags.panel"
          aria-label="Manage tags"
          className="absolute inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-panel sm:w-[26rem]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Tags &amp; notes
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tags.length === 0
                  ? "Pin hazards, cameras and reminders to the map."
                  : `${tags.length} pinned to the map.`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ocid="tags.close_button"
              aria-label="Close tag manager"
              onClick={() => setListOpen(false)}
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>

          <div className="border-b border-border px-5 py-3">
            <Button
              type="button"
              data-ocid="tags.add_button"
              onClick={handleOpenCreate}
              className="w-full"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add tag at my position
            </Button>
            <p className="mt-2 flex items-center gap-1.5 telemetry text-[11px] text-muted-foreground">
              <Crosshair className="size-3" aria-hidden="true" />
              {fix
                ? "Uses your live GPS position"
                : "Uses the current map centre"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TagList
              tags={tags}
              selectedId={selectedTag?.id ?? null}
              onFocus={handleFocusTag}
              onEdit={handleOpenEdit}
            />
          </div>
        </aside>
      )}

      <TagFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tag={editingTag}
        defaultPoint={defaultPoint}
      />
    </div>
  );
}
