import type { TagCategory } from "@/backend";
import { TAG_CATEGORIES } from "@/lib/constants";
import {
  AlertTriangle,
  Camera,
  CircleAlert,
  StickyNote,
  TrafficCone,
} from "lucide-react";

interface TagCategoryPickerProps {
  value: TagCategory;
  onChange: (category: TagCategory) => void;
  /** Optional ocid prefix so multiple pickers stay uniquely addressable. */
  ocidPrefix?: string;
  disabled?: boolean;
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

/**
 * Segmented category selector for street tags. Each option shows its marker
 * icon and tone so the choice matches what appears on the map.
 */
export function TagCategoryPicker({
  value,
  onChange,
  ocidPrefix = "tag_category",
  disabled = false,
}: TagCategoryPickerProps) {
  return (
    <fieldset
      data-ocid={`${ocidPrefix}.fieldset`}
      disabled={disabled}
      className="flex flex-wrap gap-1.5"
    >
      <legend className="sr-only">Tag category</legend>
      {TAG_CATEGORIES.map((option) => {
        const Icon = ICONS[option.value as keyof typeof ICONS] ?? StickyNote;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            data-ocid={`${ocidPrefix}.option.${option.value}`}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
              active
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full ${
                TONE_CLASSES[option.tone] ?? TONE_CLASSES.muted
              }`}
              aria-hidden="true"
            >
              <Icon className="size-3" />
            </span>
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
