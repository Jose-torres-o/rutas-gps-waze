import { type Route, type Tag, TravelMode } from "@/backend";
import { BottomDock, type DockPanel } from "@/components/layout/BottomDock";
import { StatusStrip } from "@/components/layout/StatusStrip";
import { MapControls } from "@/components/map/MapControls";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { TagMarkers } from "@/components/map/TagMarkers";
import { UserMarker } from "@/components/map/UserMarker";
import { RoutesPanel } from "@/components/panels/RoutesPanel";
import { SharePanel } from "@/components/panels/SharePanel";
import { TagsPanel } from "@/components/panels/TagsPanel";
import { SaveRouteDialog } from "@/components/record/SaveRouteDialog";
import { TagPlacementBanner } from "@/components/tags/TagPlacementBanner";
import { Button } from "@/components/ui/button";
import { useAddRoute, useRoutes, useTags } from "@/hooks/use-backend";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useTagPlacement } from "@/hooks/use-tag-placement";
import { useSetTravelMode, useTravelMode } from "@/hooks/use-travel-mode";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  RECORD_MIN_STEP_METERS,
} from "@/lib/constants";
import {
  haversineMeters,
  parseLatLng,
  pathLengthMeters,
  project,
  unproject,
} from "@/lib/geo";
import type { LatLng, MapLayer, RecordingState } from "@/types/app";
import { useSearch } from "@tanstack/react-router";
import { MapPin, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const INITIAL_LAYERS: Record<MapLayer, boolean> = {
  route: true,
  tags: true,
  signals: true,
};

export function AppShell() {
  const { fix, status, error, request } = useGeolocation({ watch: true });
  const { data: routes = [] } = useRoutes();
  const { data: tags = [] } = useTags();
  const { data: travelMode } = useTravelMode();
  const setTravelMode = useSetTravelMode();
  const addRoute = useAddRoute();
  const placement = useTagPlacement();
  const { routeId } = useSearch({ from: "/" });

  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [follow, setFollow] = useState(true);
  const [layers, setLayers] =
    useState<Record<MapLayer, boolean>>(INITIAL_LAYERS);
  const [activePanel, setActivePanel] = useState<DockPanel>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [recording, setRecording] = useState<RecordingState | null>(null);
  const [pendingRoute, setPendingRoute] = useState<RecordingState | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [sharedPoint, setSharedPoint] = useState<LatLng | null>(null);
  const [sharedLabel, setSharedLabel] = useState<string | null>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const tapRef = useRef<{ x: number; y: number } | null>(null);

  const mode = travelMode ?? TravelMode.car;

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

  /* Deep link: open centred on a shared point. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const point = parseLatLng(params.get("lat"), params.get("lng"));
    if (point) {
      setCenter(point);
      setFollow(false);
      setSharedPoint(point);
      setSharedLabel(params.get("label"));
    }
  }, []);

  /* Deep link: open a saved route on the map and fit it to bounds. */
  useEffect(() => {
    if (!routeId || routes.length === 0) return;
    const match = routes.find((route) => route.id.toString() === routeId);
    if (!match || match.points.length === 0) return;
    setSelectedRoute(match);
    setSelectedTag(null);
    setFollow(false);
    const lats = match.points.map((p) => p.lat);
    const lngs = match.points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    setCenter({ lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 });
    const span = Math.max(maxLat - minLat, maxLng - minLng);
    if (span > 0) {
      const fit = Math.floor(Math.log2(360 / span)) - 1;
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fit)));
    }
  }, [routeId, routes]);

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

  /* Append points to the in-progress recording as the device moves. */
  useEffect(() => {
    if (!recording || !fix) return;
    setRecording((current) => {
      if (!current) return current;
      const last = current.points[current.points.length - 1];
      const next: LatLng = { lat: fix.lat, lng: fix.lng };
      if (last && haversineMeters(last, next) < RECORD_MIN_STEP_METERS) {
        return current;
      }
      const points = [...current.points, next];
      return { ...current, points, distanceMeters: pathLengthMeters(points) };
    });
  }, [fix, recording]);

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

  const handleOpenPanel = useCallback((panel: Exclude<DockPanel, null>) => {
    setActivePanel((current) => (current === panel ? null : panel));
  }, []);

  const handleModeChange = useCallback(
    (next: TravelMode) => {
      setTravelMode.mutate(next, {
        onError: () => toast.error("Could not save your travel mode."),
      });
    },
    [setTravelMode],
  );

  const handleToggleRecord = useCallback(() => {
    if (recording) {
      const finished = recording;
      setRecording(null);
      if (finished.points.length < 2) {
        toast.error("Route too short to save.");
        return;
      }
      setPendingRoute(finished);
      return;
    }
    if (!fix) {
      toast.error("Waiting for a GPS fix before recording.");
      return;
    }
    setRecording({
      startedAt: Date.now(),
      points: [{ lat: fix.lat, lng: fix.lng }],
      distanceMeters: 0,
    });
    setFollow(true);
    toast.success("Recording your route.");
  }, [fix, recording]);

  const handleDiscardRecording = useCallback(() => {
    setRecording(null);
    toast.success("Recording discarded.");
  }, []);

  const handleSaveRoute = useCallback(
    (name: string) => {
      if (!pendingRoute) return;
      const finished = pendingRoute;
      const endedAt = Date.now();
      const durationSeconds = Math.max(
        1,
        Math.round((endedAt - finished.startedAt) / 1000),
      );
      addRoute.mutate(
        {
          name,
          distanceMeters: finished.distanceMeters,
          durationSeconds: BigInt(durationSeconds),
          startedAt: BigInt(finished.startedAt) * 1_000_000n,
          endedAt: BigInt(endedAt) * 1_000_000n,
          mode,
          points: finished.points.map((point, index) => ({
            lat: point.lat,
            lng: point.lng,
            timestamp: BigInt(finished.startedAt + index * 1000) * 1_000_000n,
          })),
        },
        {
          onSuccess: () => {
            setPendingRoute(null);
            toast.success("Route saved.");
          },
          onError: () => toast.error("Could not save the route."),
        },
      );
    },
    [addRoute, mode, pendingRoute],
  );

  const handleCancelSave = useCallback(() => {
    setPendingRoute(null);
    toast.info("Route not saved.");
  }, []);

  const handleSelectRoute = useCallback((route: Route) => {
    setSelectedRoute(route);
    setSelectedTag(null);
    if (route.points.length > 0) {
      const mid = route.points[Math.floor(route.points.length / 2)];
      setCenter({ lat: mid.lat, lng: mid.lng });
      setFollow(false);
    }
  }, []);

  const handleSelectTag = useCallback((tag: Tag) => {
    setSelectedTag(tag);
    setSelectedRoute(null);
    setCenter({ lat: tag.lat, lng: tag.lng });
    setFollow(false);
  }, []);

  const handleFocusTag = useCallback((tag: Tag) => {
    setCenter({ lat: tag.lat, lng: tag.lng });
    setFollow(false);
    setActivePanel(null);
    setSelectedTag(tag);
  }, []);

  const handleFocusRoute = useCallback(
    (route: Route) => {
      handleSelectRoute(route);
      setActivePanel(null);
    },
    [handleSelectRoute],
  );

  const handleSharePoint = useCallback(
    (point: LatLng, label: string | null) => {
      setSharedPoint(point);
      setSharedLabel(label);
    },
    [],
  );

  /* Capture a tap (not a drag) and convert it to a map coordinate for a tag. */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      tapRef.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handleMapClick = useCallback(
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

  const handleArmPlacement = useCallback(() => {
    setActivePanel(null);
    placement.toggleArmed();
  }, [placement]);

  const activeRoutePoints = useMemo<LatLng[]>(() => {
    if (recording) return recording.points;
    if (selectedRoute) {
      return selectedRoute.points.map((p) => ({ lat: p.lat, lng: p.lng }));
    }
    return [];
  }, [recording, selectedRoute]);

  const visibleTags = layers.tags
    ? tags.filter((tag) => layers.signals || tag.category !== "trafficSignal")
    : [];

  const recordDisabled = !recording && !fix;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the map is a pointer surface; keyboard users place tags via the "At centre" button */}
      <div
        ref={mapWrapRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onClick={handleMapClick}
      >
        <MapView
          center={center}
          zoom={zoom}
          follow={follow}
          onCenterChange={handleCenterChange}
          onZoomChange={setZoom}
          onUserPan={handleUserPan}
        >
          {layers.route && activeRoutePoints.length > 1 && (
            <RouteLine
              points={activeRoutePoints}
              center={center}
              zoom={zoom}
              size={mapSize}
              active={!!recording}
            />
          )}
          {visibleTags.length > 0 && (
            <TagMarkers
              tags={visibleTags}
              center={center}
              zoom={zoom}
              size={mapSize}
              selectedId={selectedTag?.id ?? null}
              onSelect={handleSelectTag}
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

      <StatusStrip mode={mode} status={status} fix={fix} error={error} />

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
              <MapPin className="size-3.5" aria-hidden="true" />
              At centre
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-ocid="tags.stop_placing_button"
              aria-label="Stop placing tag"
              onClick={placement.toggleArmed}
              className="size-7 rounded-full p-0"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {recording && (
        <div className="pointer-events-none absolute inset-x-3 bottom-24 z-30 flex justify-center sm:inset-x-4">
          <Button
            type="button"
            variant="outline"
            data-ocid="record.discard_button"
            onClick={handleDiscardRecording}
            className="pointer-events-auto border-destructive/40 bg-background/80 text-destructive backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Discard recording
          </Button>
        </div>
      )}

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

      <SaveRouteDialog
        open={pendingRoute !== null}
        defaultName={
          pendingRoute
            ? `Route ${new Date(pendingRoute.startedAt).toLocaleDateString()}`
            : ""
        }
        distanceMeters={pendingRoute?.distanceMeters ?? 0}
        durationSeconds={
          pendingRoute
            ? Math.max(
                1,
                Math.round((Date.now() - pendingRoute.startedAt) / 1000),
              )
            : 0
        }
        isSaving={addRoute.isPending}
        onSave={handleSaveRoute}
        onCancel={handleCancelSave}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-24 sm:px-4">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          data-ocid="map.attribution_link"
          className="pointer-events-auto rounded-md bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm hover:text-foreground"
        >
          © OpenStreetMap contributors
        </a>
      </div>

      <BottomDock
        recording={!!recording}
        activePanel={activePanel}
        onToggleRecord={handleToggleRecord}
        onOpenPanel={handleOpenPanel}
        recordDisabled={recordDisabled}
      />

      <RoutesPanel
        open={activePanel === "routes"}
        onClose={() => setActivePanel(null)}
        routes={routes}
        selectedId={selectedRoute?.id ?? null}
        onSelect={handleFocusRoute}
        mode={mode}
        onModeChange={handleModeChange}
      />

      <TagsPanel
        open={activePanel === "tags"}
        onClose={() => setActivePanel(null)}
        tags={tags}
        selectedId={selectedTag?.id ?? null}
        onSelect={handleFocusTag}
        currentPoint={fix ? { lat: fix.lat, lng: fix.lng } : center}
        onArmPlacement={handleArmPlacement}
      />

      <SharePanel
        open={activePanel === "share"}
        onClose={() => setActivePanel(null)}
        point={sharedPoint ?? (fix ? { lat: fix.lat, lng: fix.lng } : center)}
        label={sharedLabel}
        onPointChange={handleSharePoint}
      />
    </div>
  );
}
