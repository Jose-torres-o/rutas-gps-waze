import type { GeoFix, GpsStatus } from "@/types/app";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseGeolocationOptions {
  /** Continuously watch the position (true) or take a single fix (false). */
  watch?: boolean;
  /** Start acquiring as soon as the hook mounts. */
  enabled?: boolean;
}

interface UseGeolocationResult {
  fix: GeoFix | null;
  status: GpsStatus;
  error: string | null;
  /** Request a fresh fix; resolves once a position is available. */
  request: () => void;
}

/**
 * Live-only geolocation. Never replays recorded tracks — it reports the
 * device's current position and heading as the browser provides them.
 */
export function useGeolocation({
  watch = true,
  enabled = true,
}: UseGeolocationOptions = {}): UseGeolocationResult {
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const { coords, timestamp } = position;
    let heading: number | null =
      coords.heading !== null && Number.isFinite(coords.heading)
        ? coords.heading
        : null;
    if (heading === null) heading = lastHeadingRef.current;
    lastHeadingRef.current = heading;

    setFix({
      lat: coords.latitude,
      lng: coords.longitude,
      heading,
      speed:
        coords.speed !== null && Number.isFinite(coords.speed)
          ? coords.speed
          : null,
      accuracy: coords.accuracy,
      timestamp,
    });
    setStatus("live");
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setStatus("denied");
      setError(
        "Location permission denied. Enable it to see your live position.",
      );
    } else {
      setStatus("unavailable");
      setError("Unable to determine your position right now.");
    }
  }, []);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("This device does not support geolocation.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15_000,
    });
  }, [handleError, handlePosition]);

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("This device does not support geolocation.");
      return;
    }

    setStatus("locating");
    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
      );
    } else {
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15_000,
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, watch, handlePosition, handleError]);

  return { fix, status, error, request };
}
