import type { Tag, TagCategory } from "@/backend";
import { tagCategoryMeta } from "@/lib/constants";
import { project } from "@/lib/geo";
import type { LatLng } from "@/types/app";
import {
  AlertTriangle,
  Camera,
  CircleAlert,
  MapPin,
  StickyNote,
  TrafficCone,
} from "lucide-react";

interface TagMarkersProps {
  tags: Tag[];
  center: LatLng;
  zoom: number;
  size: { width: number; height: number };
  selectedId: bigint | null;
  onSelect: (tag: Tag) => void;
}

const ICONS = {
  pothole: CircleAlert,
  hazard: AlertTriangle,
  speedCamera: Camera,
  trafficSignal: TrafficCone,
  note: StickyNote,
} as const;

const TONE_CLASSES: Record<string, string> = {
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
  accent: "bg-accent text-accent-foreground",
  primary: "bg-primary text-primary-foreground",
  muted: "bg-muted text-muted-foreground",
};

function iconFor(category: TagCategory) {
  return ICONS[category] ?? MapPin;
}

/** Interactive pins for saved tags and notes, projected into screen space. */
export function TagMarkers({
  tags,
  center,
  zoom,
  size,
  selectedId,
  onSelect,
}: TagMarkersProps) {
  if (size.width === 0 || size.height === 0) return null;
  const centerPx = project(center.lat, center.lng, zoom);

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      {tags.map((tag, index) => {
        const px = project(tag.lat, tag.lng, zoom);
        const left = px.x - centerPx.x + size.width / 2;
        const top = px.y - centerPx.y + size.height / 2;
        const meta = tagCategoryMeta(tag.category);
        const Icon = iconFor(tag.category);
        const selected = selectedId !== null && selectedId === tag.id;
        return (
          <button
            key={tag.id.toString()}
            type="button"
            data-ocid={`map.tag_marker.${index + 1}`}
            onClick={() => onSelect(tag)}
            title={tag.note || meta.label}
            aria-label={`${meta.label}: ${tag.note || "no note"}`}
            className={`pointer-events-auto absolute flex size-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-background shadow-panel transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              TONE_CLASSES[meta.tone] ?? TONE_CLASSES.muted
            } ${selected ? "scale-110 ring-2 ring-ring" : ""}`}
            style={{ left, top }}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
