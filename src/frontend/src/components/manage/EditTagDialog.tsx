import { type Tag, TagCategory } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTag } from "@/hooks/use-backend";
import { TAG_CATEGORIES } from "@/lib/constants";
import { formatCoords } from "@/lib/format";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditTagDialogProps {
  tag: Tag | null;
  onOpenChange: (open: boolean) => void;
}

/** Edit a tag's category and note text. */
export function EditTagDialog({ tag, onOpenChange }: EditTagDialogProps) {
  const updateTag = useUpdateTag();
  const [category, setCategory] = useState<TagCategory>(TagCategory.hazard);
  const [note, setNote] = useState("");

  /* Seed the draft once per opened tag; never overwrite while typing. */
  useEffect(() => {
    if (!tag) return;
    setCategory(tag.category);
    setNote(tag.note);
  }, [tag]);

  const open = tag !== null;
  const trimmed = note.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tag) return;
    if (!trimmed) {
      toast.error("Note cannot be empty.");
      return;
    }
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="manage.tag_dialog"
        className="surface-glass gap-5 border-border sm:max-w-md"
      >
        <DialogHeader className="gap-2">
          <DialogTitle className="font-display text-lg">Edit tag</DialogTitle>
          <DialogDescription>
            {tag
              ? `Pinned at ${formatCoords(tag.lat, tag.lng)}.`
              : "Update the category and note for this tag."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tag-category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as TagCategory)}
            >
              <SelectTrigger
                id="tag-category"
                data-ocid="manage.tag_category_select"
                className="w-full"
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {TAG_CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tag-note">Note</Label>
            <Textarea
              id="tag-note"
              value={note}
              data-ocid="manage.tag_note_input"
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should other drivers know?"
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="manage.tag_dialog.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="manage.tag_dialog.save_button"
              disabled={updateTag.isPending || trimmed === ""}
            >
              {updateTag.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
