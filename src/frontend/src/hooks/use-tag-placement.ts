import { type TagCategory, TagCategory as TagCategoryEnum } from "@/backend";
import { useAddTag } from "@/hooks/use-backend";
import type { LatLng } from "@/types/app";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseTagPlacementResult {
  /** True while the map is armed to capture the next tap as a tag point. */
  armed: boolean;
  /** The captured map point awaiting a note, or null when nothing is pending. */
  pendingPoint: LatLng | null;
  category: TagCategory;
  note: string;
  saving: boolean;
  /** Arm or disarm tap-to-place mode. */
  toggleArmed: () => void;
  /** Capture a tapped map point and open the placement banner. */
  placeAt: (point: LatLng) => void;
  setCategory: (category: TagCategory) => void;
  setNote: (note: string) => void;
  /** Persist the pending tag; clears the draft on success. */
  save: () => void;
  /** Discard the pending point and leave placement mode. */
  cancel: () => void;
}

/**
 * Tap-to-place flow for street tags and notes. Owns the armed state, the
 * captured map point, and the in-progress note draft; persistence goes through
 * the shared `useAddTag` mutation.
 */
export function useTagPlacement(): UseTagPlacementResult {
  const addTag = useAddTag();
  const [armed, setArmed] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<LatLng | null>(null);
  const [category, setCategory] = useState<TagCategory>(TagCategoryEnum.hazard);
  const [note, setNote] = useState("");

  const toggleArmed = useCallback(() => {
    setArmed((current) => {
      if (current) setPendingPoint(null);
      return !current;
    });
  }, []);

  const placeAt = useCallback((point: LatLng) => {
    setPendingPoint(point);
    setArmed(true);
  }, []);

  const cancel = useCallback(() => {
    setPendingPoint(null);
    setArmed(false);
  }, []);

  const save = useCallback(() => {
    if (!pendingPoint) return;
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("Add a short note before saving.");
      return;
    }
    const captured = trimmed;
    const point = pendingPoint;
    setNote("");
    setPendingPoint(null);
    setArmed(false);
    addTag.mutate(
      { category, note: captured, lat: point.lat, lng: point.lng },
      {
        onSuccess: () => toast.success("Tag pinned to the map."),
        onError: () => {
          setNote((current) => (current === "" ? captured : current));
          setPendingPoint(point);
          toast.error("Could not save the tag.");
        },
      },
    );
  }, [addTag, category, note, pendingPoint]);

  return {
    armed,
    pendingPoint,
    category,
    note,
    saving: addTag.isPending,
    toggleArmed,
    placeAt,
    setCategory,
    setNote,
    save,
    cancel,
  };
}
