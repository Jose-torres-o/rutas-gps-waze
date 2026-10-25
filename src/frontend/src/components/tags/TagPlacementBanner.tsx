import type { TagCategory } from "@/backend";
import { TagCategoryPicker } from "@/components/tags/TagCategoryPicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCoords } from "@/lib/format";
import type { LatLng } from "@/types/app";
import { Check, MapPin, X } from "lucide-react";

interface TagPlacementBannerProps {
  /** The captured map point awaiting a note, or null when nothing is pending. */
  point: LatLng | null;
  category: TagCategory;
  note: string;
  saving: boolean;
  onCategoryChange: (category: TagCategory) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Floating glass banner shown after a map tap, capturing the category and note
 * for a new tag before it is pinned.
 */
export function TagPlacementBanner({
  point,
  category,
  note,
  saving,
  onCategoryChange,
  onNoteChange,
  onSave,
  onCancel,
}: TagPlacementBannerProps) {
  if (!point) return null;

  return (
    <section
      data-ocid="tag_placement.banner"
      aria-label="New tag at tapped point"
      className="pointer-events-auto absolute inset-x-3 bottom-24 z-40 rounded-2xl surface-glass p-4 shadow-panel sm:inset-x-auto sm:left-1/2 sm:w-[26rem] sm:-translate-x-1/2"
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            Pin a tag here
          </p>
          <p className="mt-0.5 telemetry text-[11px] text-muted-foreground">
            {formatCoords(point.lat, point.lng)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="tag_placement.close_button"
          aria-label="Cancel placing tag"
          onClick={onCancel}
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <TagCategoryPicker
        value={category}
        onChange={onCategoryChange}
        ocidPrefix="tag_placement.category"
        disabled={saving}
      />

      <Textarea
        value={note}
        data-ocid="tag_placement.note_input"
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="What should other drivers know?"
        aria-label="Tag note"
        rows={2}
        className="mt-3 resize-none"
      />

      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          data-ocid="tag_placement.cancel_button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          data-ocid="tag_placement.save_button"
          onClick={onSave}
          disabled={saving || note.trim() === ""}
        >
          <Check className="size-4" aria-hidden="true" />
          {saving ? "Saving…" : "Save tag"}
        </Button>
      </div>
    </section>
  );
}
