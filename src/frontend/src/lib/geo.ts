import type { LatLng } from "@/types/app";

const EARTH_RADIUS_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Great-circle distance between two coordinates in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a polyline in metres. */
export function pathLengthMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/** Bearing in degrees (0–360) from point a to point b. */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLng = toRadians(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Web-Mercator projection of a coordinate into world pixel space at a zoom. */
export function project(
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin(toRadians(lat));
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/** Inverse Web-Mercator projection from world pixel space back to a coordinate. */
export function unproject(x: number, y: number, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = toDegrees(Math.atan(Math.sinh(n)));
  return { lat, lng };
}

const TILE_SIZE = 256;

/** Parse a `lat,lng` pair from a URL search string, returning null when invalid. */
export function parseLatLng(
  lat: string | null,
  lng: string | null,
): LatLng | null {
  if (lat === null || lng === null) return null;
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  if (
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLng < -180 ||
    parsedLng > 180
  ) {
    return null;
  }
  return { lat: parsedLat, lng: parsedLng };
}

/** Build a shareable deep link that reopens the app centred on a point. */
export function buildShareLink(point: LatLng, label?: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("lat", point.lat.toFixed(6));
  url.searchParams.set("lng", point.lng.toFixed(6));
  if (label?.trim()) url.searchParams.set("label", label.trim());
  return url.toString();
}

/** WhatsApp share intent URL for a location link. */
export function whatsappShareUrl(link: string, message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`;
}
