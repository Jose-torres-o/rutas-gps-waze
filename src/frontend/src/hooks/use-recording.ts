import type { TravelMode } from "@/backend";
import { useAddRoute } from "@/hooks/use-backend";
import { RECORD_MIN_STEP_METERS } from "@/lib/constants";
import { haversineMeters, pathLengthMeters } from "@/lib/geo";
import type { GeoFix, LatLng } from "@/types/app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** A route captured from live GPS fixes, before it is named and saved. */
export interface RecordingDraft {
  startedAt: number;
  endedAt: number;
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  /** Average speed over the whole recording, in metres per second. */
  averageSpeed: number;
}

interface UseRecordingOptions {
  /** The latest live fix, or null while the device has no position yet. */
  fix: GeoFix | null;
  /** Travel mode persisted with the saved route. */
  mode: TravelMode;
}

interface UseRecordingResult {
  /** True while a recording is in progress. */
  isRecording: boolean;
  /** Live path points captured so far. */
  points: LatLng[];
  /** Metres travelled so far. */
  distanceMeters: number;
  /** Seconds elapsed since the recording started. */
  elapsedSeconds: number;
  /** Current speed in metres per second, from the latest fix. */
  currentSpeed: number | null;
  /** The finished draft awaiting a name, or null when nothing is pending. */
  pending: RecordingDraft | null;
  /** True while the save mutation is in flight. */
  isSaving: boolean;
  /** Begin a new recording from the current fix. */
  start: () => void;
  /** Stop the recording and surface the draft for naming. */
  stop: () => void;
  /** Throw away the in-progress recording without saving. */
  discard: () => void;
  /** Save the pending draft under a name. */
  save: (name: string) => void;
  /** Dismiss the pending draft without saving it. */
  cancelPending: () => void;
}

/**
 * Owns the full lifecycle of a live route recording: capture, live telemetry,
 * naming, saving, and discarding. Never replays a track — points are appended
 * only from the device's current position.
 */
export function useRecording({
  fix,
  mode,
}: UseRecordingOptions): UseRecordingResult {
  const addRoute = useAddRoute();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [pending, setPending] = useState<RecordingDraft | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastPointRef = useRef<LatLng | null>(null);

  const isRecording = startedAt !== null;

  /* Tick the elapsed clock once per second while recording. */
  useEffect(() => {
    if (!isRecording) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  /* Append the live fix whenever the device has moved far enough. */
  useEffect(() => {
    if (!isRecording || !fix) return;
    const next: LatLng = { lat: fix.lat, lng: fix.lng };
    const last = lastPointRef.current;
    if (last && haversineMeters(last, next) < RECORD_MIN_STEP_METERS) return;
    lastPointRef.current = next;
    setPoints((current) => [...current, next]);
  }, [fix, isRecording]);

  const distanceMeters = useMemo(() => pathLengthMeters(points), [points]);

  const elapsedSeconds = useMemo(() => {
    if (startedAt === null) return 0;
    return Math.max(0, Math.round((now - startedAt) / 1000));
  }, [now, startedAt]);

  const start = useCallback(() => {
    if (!fix) return;
    const point: LatLng = { lat: fix.lat, lng: fix.lng };
    lastPointRef.current = point;
    setPoints([point]);
    setPending(null);
    setStartedAt(Date.now());
  }, [fix]);

  const stop = useCallback(() => {
    if (startedAt === null) return;
    const endedAt = Date.now();
    const durationSeconds = Math.max(
      1,
      Math.round((endedAt - startedAt) / 1000),
    );
    const distance = pathLengthMeters(points);
    setStartedAt(null);
    lastPointRef.current = null;
    if (points.length < 2) {
      setPoints([]);
      setPending(null);
      return;
    }
    setPending({
      startedAt,
      endedAt,
      points,
      distanceMeters: distance,
      durationSeconds,
      averageSpeed: distance / durationSeconds,
    });
  }, [points, startedAt]);

  const discard = useCallback(() => {
    setStartedAt(null);
    setPoints([]);
    setPending(null);
    lastPointRef.current = null;
  }, []);

  const cancelPending = useCallback(() => {
    setPending(null);
    setPoints([]);
  }, []);

  const save = useCallback(
    (name: string) => {
      if (!pending) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const draft = pending;
      addRoute.mutate(
        {
          name: trimmed,
          distanceMeters: draft.distanceMeters,
          durationSeconds: BigInt(draft.durationSeconds),
          startedAt: BigInt(draft.startedAt) * 1_000_000n,
          endedAt: BigInt(draft.endedAt) * 1_000_000n,
          mode,
          points: draft.points.map((point, index) => ({
            lat: point.lat,
            lng: point.lng,
            timestamp: BigInt(draft.startedAt + index * 1000) * 1_000_000n,
          })),
        },
        {
          onSuccess: () => {
            setPending(null);
            setPoints([]);
          },
        },
      );
    },
    [addRoute, mode, pending],
  );

  return {
    isRecording,
    points,
    distanceMeters,
    elapsedSeconds,
    currentSpeed: fix?.speed ?? null,
    pending,
    isSaving: addRoute.isPending,
    start,
    stop,
    discard,
    save,
    cancelPending,
  };
}
