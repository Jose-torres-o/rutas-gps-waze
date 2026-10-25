import type { Tag } from "@/backend";
import { DeleteConfirmDialog } from "@/components/manage/DeleteConfirmDialog";
import { EditTagDialog } from "@/components/manage/EditTagDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteTag, useTags } from "@/hooks/use-backend";
import { tagCategoryMeta } from "@/lib/constants";
import { formatCoords, formatDateTime, timestampToDate } from "@/lib/format";
import { Pencil, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SKELETON_IDS = Array.from({ length: 3 }, (_, i) => `tag-skeleton-${i}`);

/** Tags tab: list, edit and delete tags and notes. */
export function ManageTagsTab() {
  const { data: tags = [], isLoading } = useTags();
  const deleteTag = useDeleteTag();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteTag.mutate(target.id, {
      onSuccess: () => {
        toast.success("Tag deleted.");
        setPendingDelete(null);
      },
      onError: () => toast.error("Could not delete the tag."),
    });
  };

  if (isLoading) {
    return (
      <div
        data-ocid="manage.tags.loading_state"
        className="flex flex-col gap-3"
      >
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div
        data-ocid="manage.tags.empty_state"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TagIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-semibold text-foreground">
          No tags or notes
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Drop a tag on the map to flag a hazard, camera or reminder, then edit
          it here.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul data-ocid="manage.tags.list" className="flex flex-col gap-3">
        {tags.map((tag, index) => {
          const meta = tagCategoryMeta(tag.category);
          return (
            <li
              key={tag.id.toString()}
              data-ocid={`manage.tags.item.${index + 1}`}
              className="rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    {tag.note || "No note"}
                  </p>
                  <p className="mt-1 telemetry text-[11px] text-muted-foreground">
                    {formatCoords(tag.lat, tag.lng)} ·{" "}
                    {formatDateTime(timestampToDate(tag.createdAt))}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-ocid={`manage.tags.edit_button.${index + 1}`}
                  onClick={() => setEditing(tag)}
                  className="h-8 px-3 text-xs"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-ocid={`manage.tags.delete_button.${index + 1}`}
                  onClick={() => setPendingDelete(tag)}
                  className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <EditTagDialog
        tag={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this tag?"
        description={
          pendingDelete
            ? `The ${tagCategoryMeta(pendingDelete.category).label.toLowerCase()} tag at ${formatCoords(pendingDelete.lat, pendingDelete.lng)} will be permanently removed.`
            : ""
        }
        pending={deleteTag.isPending}
        onConfirm={handleConfirmDelete}
        ocid="manage.tag_delete_dialog"
      />
    </>
  );
}
