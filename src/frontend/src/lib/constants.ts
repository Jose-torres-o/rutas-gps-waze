import { TagCategory, TravelMode } from "@/backend";

export const APP_NAME = "Rutas GPS";

/** Default map centre — Madrid, Spain. */
export const DEFAULT_CENTER = { lat: 40.4168, lng: -3.7038 };
export const DEFAULT_ZOOM = 15;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 19;

/** Tile size for the OpenStreetMap raster layer. */
export const TILE_SIZE = 256;

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface TravelModeMeta {
  value: TravelMode;
  label: string;
  /** Icon key resolved in the UI layer to a lucide icon. */
  icon: "car" | "bus" | "motorcycle" | "bicycle" | "walking";
  /** Average speed in km/h used for rough duration estimates. */
  avgSpeedKmh: number;
}

export const TRAVEL_MODES: TravelModeMeta[] = [
  { value: TravelMode.car, label: "Car", icon: "car", avgSpeedKmh: 45 },
  { value: TravelMode.bus, label: "Bus", icon: "bus", avgSpeedKmh: 28 },
  {
    value: TravelMode.motorcycle,
    label: "Motorcycle",
    icon: "motorcycle",
    avgSpeedKmh: 50,
  },
  {
    value: TravelMode.bicycle,
    label: "Bicycle",
    icon: "bicycle",
    avgSpeedKmh: 16,
  },
  {
    value: TravelMode.walking,
    label: "Walking",
    icon: "walking",
    avgSpeedKmh: 5,
  },
];

export function travelModeMeta(mode: TravelMode): TravelModeMeta {
  return TRAVEL_MODES.find((m) => m.value === mode) ?? TRAVEL_MODES[0];
}

export interface TagCategoryMeta {
  value: TagCategory;
  label: string;
  /** Tailwind-friendly token name used for the marker colour. */
  tone: "destructive" | "warning" | "accent" | "primary" | "muted";
}

export const TAG_CATEGORIES: TagCategoryMeta[] = [
  { value: TagCategory.pothole, label: "Pothole", tone: "destructive" },
  { value: TagCategory.hazard, label: "Hazard", tone: "warning" },
  { value: TagCategory.speedCamera, label: "Speed camera", tone: "accent" },
  {
    value: TagCategory.trafficSignal,
    label: "Traffic signal",
    tone: "primary",
  },
  { value: TagCategory.note, label: "Note", tone: "muted" },
];

export function tagCategoryMeta(category: TagCategory): TagCategoryMeta {
  return TAG_CATEGORIES.find((c) => c.value === category) ?? TAG_CATEGORIES[4];
}

/** Minimum distance (metres) between recorded points before appending a new one. */
export const RECORD_MIN_STEP_METERS = 8;
