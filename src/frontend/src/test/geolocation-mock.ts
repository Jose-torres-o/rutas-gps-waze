import type { GeoFix } from "@/types/app";
import { vi } from "vitest";

/**
 * A controllable stand-in for `navigator.geolocation`. Tests drive it by
 * calling `emit`/`fail` so the app's live-position behaviour can be exercised
 * without a real device. It is a mock: it proves nothing about browser
 * geolocation itself.
 */
export interface GeolocationMock {
  /** Deliver a successful position to the active watch/getCurrentPosition. */
  emit: (fix: GeoFix) => void;
  /** Deliver a permission-denied error to the active watch. */
  deny: () => void;
  /** Deliver a generic position-unavailable error. */
  fail: () => void;
  /** True once the app has started watching or requested a fix. */
  started: () => boolean;
  /** Number of active watches the app has registered. */
  watchCount: () => number;
  restore: () => void;
}

function toPosition(fix: GeoFix): GeolocationPosition {
  return {
    coords: {
      latitude: fix.lat,
      longitude: fix.lng,
      heading: fix.heading,
      speed: fix.speed,
      accuracy: fix.accuracy,
      altitude: null,
      altitudeAccuracy: null,
    },
    timestamp: fix.timestamp,
  } as GeolocationPosition;
}

function toError(code: number): GeolocationPositionError {
  return {
    code,
    message: code === 1 ? "User denied Geolocation" : "Position unavailable",
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

/**
 * Install a fake geolocation on `navigator`. Returns a handle the test uses to
 * push fixes and errors, plus a `restore` for teardown.
 */
export function installGeolocationMock(): GeolocationMock {
  const successHandlers = new Set<PositionCallback>();
  const errorHandlers = new Set<PositionErrorCallback>();
  let watchId = 0;
  const activeWatches = new Set<number>();

  const geolocation = {
    getCurrentPosition: vi.fn(
      (success: PositionCallback, error?: PositionErrorCallback | null) => {
        successHandlers.add(success);
        if (error) errorHandlers.add(error);
      },
    ),
    watchPosition: vi.fn(
      (success: PositionCallback, error?: PositionErrorCallback | null) => {
        successHandlers.add(success);
        if (error) errorHandlers.add(error);
        watchId += 1;
        activeWatches.add(watchId);
        return watchId;
      },
    ),
    clearWatch: vi.fn((id: number) => {
      activeWatches.delete(id);
    }),
  };

  const original = Object.getOwnPropertyDescriptor(navigator, "geolocation");
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    writable: true,
    value: geolocation,
  });

  return {
    emit: (fix) => {
      for (const handler of successHandlers) handler(toPosition(fix));
    },
    deny: () => {
      for (const handler of errorHandlers) handler(toError(1));
    },
    fail: () => {
      for (const handler of errorHandlers) handler(toError(2));
    },
    started: () => successHandlers.size > 0 || errorHandlers.size > 0,
    watchCount: () => activeWatches.size,
    restore: () => {
      if (original) {
        Object.defineProperty(navigator, "geolocation", original);
      } else {
        // jsdom does not define `geolocation`; clear the fake we installed.
        // Assigning `undefined` rather than `delete` avoids the noDelete lint
        // rule and leaves the property in the same absent-like state.
        Object.defineProperty(navigator, "geolocation", {
          configurable: true,
          writable: true,
          value: undefined,
        });
      }
    },
  };
}
