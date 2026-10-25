import type { Route, Tag, TagCategory, TravelMode } from "@/backend";

export type { Route, Tag, TagCategory, TravelMode };

/** A live GPS fix from the browser geolocation API. */
export interface GeoFix {
  lat: number;
  lng: number;
  /** Degrees clockwise from north, or null when the device cannot report it. */
  heading: number | null;
  /** Metres per second, or null when unavailable. */
  speed: number | null;
  /** Metres of horizontal accuracy. */
  accuracy: number;
  /** Epoch milliseconds when this fix was captured. */
  timestamp: number;
}

export type GpsStatus = "idle" | "locating" | "live" | "denied" | "unavailable";

export type MapLayer = "route" | "tags" | "signals";

export interface LatLng {
  lat: number;
  lng: number;
}

/** A route currently being recorded from live GPS fixes. */
export interface RecordingState {
  startedAt: number;
  points: LatLng[];
  distanceMeters: number;
}
