import {
  type Tag,
  type TagCategory,
  TagCategory as TagCategoryEnum,
} from "@/backend";
import { TagCategoryPicker } from "@/components/tags/TagCategoryPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddTag, useUpdateTag } from "@/hooks/use-backend";
import { formatCoords } from "@/lib/format";
import type { LatLng } from "@/types/app";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set the dialog edits this tag; otherwise it creates a new one. */
  tag: Tag | null;
  /** Coordinates used when creating a tag from the management panel. */
  defaultPoint: LatLng;
}

/**
 * Add / edit dialog for street tags and notes. Coordinates are fixed at the
 * tag's map point; only category and note are editable.
 */
export function TagFormDialog({
  open,
  onOpenChange,
  tag,
  defaultPoint,
}: TagFormDialogProps) {
  const addTag = useAddTag();
  const updateTag = useUpdateTag();

  const [category, setCategory] = useState<TagCategory>(TagCategoryEnum.hazard);
  const [note, setNote] = useState("");

  /* Seed the draft once per open — never overwrite it from a refetch. */
  useEffect(() => {
    if (!open) return;
    setCategory(tag?.category ?? TagCategoryEnum.hazard);
    setNote(tag?.note ?? "");
  }, [open, tag]);

  const point: LatLng = tag ? { lat: tag.lat, lng: tag.lng } : defaultPoint;
  const pending = addTag.isPending || updateTag.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("Add a short note before saving.");
      return;
    }
    if (tag) {
      updateTag.mutate(
        { id: tag.id, update: { note: trimmed, category } },
        {
          onSuccess: () => {
            toast.success("Tag updated.");
            onOpenChange(false);
          },
          onError: () => toast.error("Could not update the tag."),
        },
      );
      return;
    }
    addTag.mutate(
      { category, note: trimmed, lat: point.lat, lng: point.lng },
      {
        onSuccess: () => {
          toast.success("Tag added.");
          onOpenChange(false);
        },
        onError: () => toast.error("Could not add the tag."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="tag_form.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {tag ? "Edit tag" : "Add tag"}
          </DialogTitle>
          <DialogDescription>
            {tag
              ? "Update the category or note for this map point."
              : "Pin a hazard, camera or reminder to a map point."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <TagCategoryPicker
              value={category}
              onChange={setCategory}
              ocidPrefix="tag_form.category"
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tag-form-note">Note</Label>
            <Textarea
              id="tag-form-note"
              value={note}
              data-ocid="tag_form.note_input"
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should other drivers know?"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tag-form-point">Map point</Label>
            <Input
              id="tag-form-point"
              value={formatCoords(point.lat, point.lng)}
              readOnly
              data-ocid="tag_form.point_input"
              className="telemetry text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              data-ocid="tag_form.cancel_button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="tag_form.submit_button"
              disabled={pending || note.trim() === ""}
            >
              {pending ? "Saving…" : tag ? "Save changes" : "Add tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
