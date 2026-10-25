import { type Tag, TagCategory } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAddTag, useDeleteTag, useUpdateTag } from "@/hooks/use-backend";
import { TAG_CATEGORIES, tagCategoryMeta } from "@/lib/constants";
import { formatCoords, formatDateTime, timestampToDate } from "@/lib/format";
import type { LatLng } from "@/types/app";
import { MapPin, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TagsPanelProps {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
  selectedId: bigint | null;
  onSelect: (tag: Tag) => void;
  currentPoint: LatLng;
  /** Arm tap-to-place mode so the next map tap pins a tag at that point. */
  onArmPlacement: () => void;
}

/** Management panel for tags and notes pinned to map coordinates. */
export function TagsPanel({
  open,
  onClose,
  tags,
  selectedId,
  onSelect,
  currentPoint,
  onArmPlacement,
}: TagsPanelProps) {
  const addTag = useAddTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [category, setCategory] = useState<TagCategory>(TagCategory.hazard);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState<TagCategory>(
    TagCategory.hazard,
  );

  const handleAdd = () => {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("Add a short note before saving.");
      return;
    }
    const captured = trimmed;
    setNote("");
    addTag.mutate(
      {
        category,
        note: captured,
        lat: currentPoint.lat,
        lng: currentPoint.lng,
      },
      {
        onSuccess: () => toast.success("Tag added at your position."),
        onError: () => {
          setNote((current) => (current === "" ? captured : current));
          toast.error("Could not add the tag.");
        },
      },
    );
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditNote(tag.note);
    setEditCategory(tag.category);
  };

  const saveEdit = (tag: Tag) => {
    const trimmed = editNote.trim();
    if (!trimmed) {
      toast.error("Note cannot be empty.");
      return;
    }
    updateTag.mutate(
      { id: tag.id, update: { note: trimmed, category: editCategory } },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Tag updated.");
        },
        onError: () => toast.error("Could not update the tag."),
      },
    );
  };

  const handleDelete = (tag: Tag) => {
    deleteTag.mutate(tag.id, {
      onSuccess: () => toast.success("Tag deleted."),
      onError: () => toast.error("Could not delete the tag."),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        data-ocid="tags.sheet"
        className="max-h-[80dvh] gap-0 rounded-t-2xl border-border bg-card p-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[26rem] sm:max-w-md sm:rounded-none sm:border-l"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-lg">
            Tags &amp; notes
          </SheetTitle>
          <SheetDescription>
            Pin hazards, cameras and reminders to the map at your current
            position.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            <span className="telemetry">
              {formatCoords(currentPoint.lat, currentPoint.lng)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as TagCategory)}
            >
              <SelectTrigger
                data-ocid="tags.category_select"
                className="w-full"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {TAG_CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={note}
              data-ocid="tags.note_input"
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should other drivers know?"
              aria-label="Tag note"
              rows={2}
              className="resize-none"
            />
            <Button
              type="button"
              data-ocid="tags.add_button"
              disabled={addTag.isPending || note.trim() === ""}
              onClick={handleAdd}
              className="w-full"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add tag here
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="tags.place_on_map_button"
              onClick={onArmPlacement}
              className="w-full"
            >
              <MapPin className="size-4" aria-hidden="true" />
              Place on map
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tags.length === 0 ? (
            <div
              data-ocid="tags.empty_state"
              className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <TagIcon className="size-6" aria-hidden="true" />
              </span>
              <p className="font-display text-sm font-semibold text-foreground">
                No tags yet
              </p>
              <p className="text-xs text-muted-foreground">
                Add your first tag using the form above.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {tags.map((tag, index) => {
                const meta = tagCategoryMeta(tag.category);
                const selected = selectedId !== null && selectedId === tag.id;
                const editing = editingId === tag.id;
                return (
                  <li
                    key={tag.id.toString()}
                    data-ocid={`tags.item.${index + 1}`}
                    className={`rounded-xl border p-3 transition-colors ${
                      selected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background/40 hover:border-primary/30"
                    }`}
                  >
                    {editing ? (
                      <div className="flex flex-col gap-2">
                        <Select
                          value={editCategory}
                          onValueChange={(value) =>
                            setEditCategory(value as TagCategory)
                          }
                        >
                          <SelectTrigger
                            data-ocid={`tags.edit_category_select.${index + 1}`}
                            className="w-full"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAG_CATEGORIES.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={editNote}
                          data-ocid={`tags.edit_note_input.${index + 1}`}
                          onChange={(event) => setEditNote(event.target.value)}
                          aria-label="Edit note"
                          rows={2}
                          className="resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            data-ocid={`tags.cancel_button.${index + 1}`}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            data-ocid={`tags.save_button.${index + 1}`}
                            disabled={updateTag.isPending}
                            onClick={() => saveEdit(tag)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelect(tag)}
                          className="flex w-full items-start gap-3 text-left"
                        >
                          <span className="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {meta.label}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">
                              {tag.note || "No note"}
                            </p>
                            <p className="mt-0.5 telemetry text-[11px] text-muted-foreground">
                              {formatCoords(tag.lat, tag.lng)} ·{" "}
                              {formatDateTime(timestampToDate(tag.createdAt))}
                            </p>
                          </div>
                        </button>
                        <div className="mt-2 flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            data-ocid={`tags.edit_button.${index + 1}`}
                            onClick={() => startEdit(tag)}
                            className="h-7 px-2 text-xs"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            data-ocid={`tags.delete_button.${index + 1}`}
                            disabled={deleteTag.isPending}
                            onClick={() => handleDelete(tag)}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
