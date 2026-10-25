import { TravelMode } from "@/backend";
import { MapControls } from "@/components/map/MapControls";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { UserMarker } from "@/components/map/UserMarker";
import { RecordingControls } from "@/components/record/RecordingControls";
import { RecordingHud } from "@/components/record/RecordingHud";
import { SaveRouteDialog } from "@/components/record/SaveRouteDialog";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useRecording } from "@/hooks/use-recording";
import { useTravelMode } from "@/hooks/use-travel-mode";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/lib/constants";
import type { LatLng, MapLayer } from "@/types/app";
import { AlertTriangle, MapPinOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LAYERS: Record<MapLayer, boolean> = {
  route: true,
  tags: false,
  signals: false,
};

/**
 * Dedicated route-recording screen: a full-bleed map with a live telemetry HUD,
 * record controls, and a save prompt. Position is always live — never replayed.
 */
export function RecordPage() {
  const { fix, status, error, request } = useGeolocation({ watch: true });
  const { data: travelMode } = useTravelMode();
  const mode = travelMode ?? TravelMode.car;

  const recording = useRecording({ fix, mode });

  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [follow, setFollow] = useState(true);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

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

  const handleStart = useCallback(() => {
    if (!fix) {
      toast.error("Waiting for a GPS fix before recording.");
      return;
    }
    recording.start();
    setFollow(true);
    toast.success("Recording your route.");
  }, [fix, recording]);

  const handleStop = useCallback(() => {
    recording.stop();
  }, [recording]);

  const handleDiscard = useCallback(() => {
    recording.discard();
    toast.success("Recording discarded.");
  }, [recording]);

  const handleSave = useCallback(
    (name: string) => {
      recording.save(name);
    },
    [recording],
  );

  const handleCancelSave = useCallback(() => {
    recording.cancelPending();
    toast.info("Route not saved.");
  }, [recording]);

  const defaultName = recording.pending
    ? `Route ${new Date(recording.pending.startedAt).toLocaleDateString()}`
    : "";

  const permissionBlocked = status === "denied" || status === "unavailable";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <div ref={mapWrapRef} className="absolute inset-0">
        <MapView
          center={center}
          zoom={zoom}
          follow={follow}
          onCenterChange={handleCenterChange}
          onZoomChange={setZoom}
          onUserPan={handleUserPan}
        >
          {recording.points.length > 1 && (
            <RouteLine
              points={recording.points}
              center={center}
              zoom={zoom}
              size={mapSize}
              active
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

      <header
        data-ocid="record.header"
        className="pointer-events-auto absolute inset-x-3 top-3 z-30 flex items-center gap-2 rounded-2xl surface-glass px-4 py-2.5 shadow-panel sm:inset-x-4 sm:top-4"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <MapPinOff className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Route recording
          </p>
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {recording.isRecording
              ? "Capturing your live path"
              : "Ready when you are"}
          </p>
        </div>
      </header>

      {permissionBlocked && (
        <div
          data-ocid="record.error_state"
          role="alert"
          className="pointer-events-auto absolute inset-x-3 top-20 z-30 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 shadow-panel sm:inset-x-4 sm:top-24"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-foreground">
              Location unavailable
            </p>
            <p className="text-xs text-muted-foreground">
              {error ??
                "Enable location access to record a route from your live position."}
            </p>
          </div>
          <button
            type="button"
            data-ocid="record.retry_button"
            onClick={request}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/15"
          >
            Retry
          </button>
        </div>
      )}

      {recording.isRecording && (
        <RecordingHud
          elapsedSeconds={recording.elapsedSeconds}
          distanceMeters={recording.distanceMeters}
          currentSpeed={recording.currentSpeed}
          pointCount={recording.points.length}
        />
      )}

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        layers={LAYERS}
        onToggleLayer={() => undefined}
        locating={status === "locating"}
      />

      <RecordingControls
        isRecording={recording.isRecording}
        startDisabled={!fix}
        onStart={handleStart}
        onStop={handleStop}
        onDiscard={handleDiscard}
      />

      <SaveRouteDialog
        open={recording.pending !== null}
        defaultName={defaultName}
        distanceMeters={recording.pending?.distanceMeters ?? 0}
        durationSeconds={recording.pending?.durationSeconds ?? 0}
        isSaving={recording.isSaving}
        onSave={handleSave}
        onCancel={handleCancelSave}
      />
    </div>
  );
}
