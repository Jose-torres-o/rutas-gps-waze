import type { Tag } from "@/backend";
import { Button } from "@/components/ui/button";
import { useDeleteTag } from "@/hooks/use-backend";
import { tagCategoryMeta } from "@/lib/constants";
import { formatCoords, formatRelative, timestampToDate } from "@/lib/format";
import {
  AlertTriangle,
  Camera,
  CircleAlert,
  Crosshair,
  Pencil,
  StickyNote,
  Tag as TagIcon,
  TrafficCone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface TagListProps {
  tags: Tag[];
  selectedId: bigint | null;
  onFocus: (tag: Tag) => void;
  onEdit: (tag: Tag) => void;
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

/** Scrollable list of saved tags with focus, edit and delete actions. */
export function TagList({ tags, selectedId, onFocus, onEdit }: TagListProps) {
  const deleteTag = useDeleteTag();

  if (tags.length === 0) {
    return (
      <div
        data-ocid="tag_list.empty_state"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TagIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-semibold text-foreground">
          No tags yet
        </p>
        <p className="max-w-[22ch] text-xs text-muted-foreground">
          Tap the map to pin your first hazard, camera or note.
        </p>
      </div>
    );
  }

  return (
    <ul data-ocid="tag_list.list" className="flex flex-col gap-2">
      {tags.map((tag, index) => {
        const meta = tagCategoryMeta(tag.category);
        const Icon = ICONS[tag.category as keyof typeof ICONS] ?? TagIcon;
        const selected = selectedId !== null && selectedId === tag.id;
        return (
          <li
            key={tag.id.toString()}
            data-ocid={`tag_list.item.${index + 1}`}
            className={`rounded-xl border p-3 transition-colors ${
              selected
                ? "border-primary/60 bg-primary/10"
                : "border-border bg-background/40 hover:border-primary/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  TONE_CLASSES[meta.tone] ?? TONE_CLASSES.muted
                }`}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </span>
                  <span className="telemetry text-[11px] text-muted-foreground">
                    {formatRelative(timestampToDate(tag.createdAt))}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-foreground">
                  {tag.note || "No note"}
                </p>
                <p className="mt-0.5 telemetry text-[11px] text-muted-foreground">
                  {formatCoords(tag.lat, tag.lng)}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-ocid={`tag_list.focus_button.${index + 1}`}
                onClick={() => onFocus(tag)}
                className="h-7 px-2 text-xs"
              >
                <Crosshair className="size-3.5" aria-hidden="true" />
                Show
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-ocid={`tag_list.edit_button.${index + 1}`}
                onClick={() => onEdit(tag)}
                className="h-7 px-2 text-xs"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-ocid={`tag_list.delete_button.${index + 1}`}
                disabled={deleteTag.isPending}
                onClick={() =>
                  deleteTag.mutate(tag.id, {
                    onSuccess: () => toast.success("Tag deleted."),
                    onError: () => toast.error("Could not delete the tag."),
                  })
                }
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
