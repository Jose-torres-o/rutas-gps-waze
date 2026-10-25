import type { TravelMode } from "@/backend";
import type { LatLng } from "@/types/app";

/**
 * OSRM routing client. Uses the public demo server (no API key) to compute
 * join paths from the live position back onto a saved route.
 *
 * Docs: https://project-osrm.org/docs/v26.6.1/http
 * Endpoint: GET /route/v1/{profile}/{lng},{lat};{lng},{lat}?geometries=geojson
 */

const OSRM_BASE = "https://router.project-osrm.org";

/** OSRM profile names supported by the public demo server. */
export type OsrmProfile = "driving" | "cycling" | "walking";

/** Map an app travel mode onto the closest OSRM routing profile. */
export function osrmProfileForMode(mode: TravelMode): OsrmProfile {
  switch (mode) {
    case "bicycle":
      return "cycling";
    case "walking":
      return "walking";
    default:
      // car, bus and motorcycle all follow the road network.
      return "driving";
  }
}

export interface OsrmRoute {
  /** Total distance in metres. */
  distanceMeters: number;
  /** Estimated travel time in seconds. */
  durationSeconds: number;
  /** Decoded path as geographic coordinates. */
  points: LatLng[];
}

interface OsrmGeoJsonGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

interface OsrmRouteJson {
  distance: number;
  duration: number;
  geometry: OsrmGeoJsonGeometry;
}

interface OsrmResponseJson {
  code: string;
  routes?: OsrmRouteJson[];
}

function toCoordinateString(points: LatLng[]): string {
  return points.map((p) => `${p.lng},${p.lat}`).join(";");
}

/**
 * Request up to `alternatives` routes between two or more coordinates.
 * Returns an empty array when OSRM reports no route or the request fails.
 */
export async function fetchOsrmRoutes(
  points: LatLng[],
  profile: OsrmProfile,
  alternatives = 1,
  signal?: AbortSignal,
): Promise<OsrmRoute[]> {
  if (points.length < 2) return [];

  const coords = toCoordinateString(points);
  const params = new URLSearchParams({
    alternatives: String(Math.max(1, alternatives)),
    geometries: "geojson",
    overview: "full",
    steps: "false",
  });
  const url = `${OSRM_BASE}/route/v1/${profile}/${coords}?${params.toString()}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`OSRM request failed (${response.status})`);
  }

  const data = (await response.json()) as OsrmResponseJson;
  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    return [];
  }

  return data.routes.map((route) => ({
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    points: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
  }));
}
