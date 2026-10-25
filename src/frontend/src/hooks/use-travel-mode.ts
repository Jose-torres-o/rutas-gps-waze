import { type TravelMode, createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const TRAVEL_MODE_KEY = ["travelMode"];

/**
 * The caller's persisted travel mode. Backend-owned, so it survives across
 * sessions and devices rather than living in local storage.
 */
export function useTravelMode() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: TRAVEL_MODE_KEY,
    queryFn: async (): Promise<TravelMode | null> => {
      if (!actor) return null;
      return actor.getTravelMode();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetTravelMode() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: TravelMode) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setTravelMode(mode);
    },
    onSuccess: (mode) => {
      queryClient.setQueryData(TRAVEL_MODE_KEY, mode);
      void queryClient.invalidateQueries({ queryKey: TRAVEL_MODE_KEY });
    },
  });
}
