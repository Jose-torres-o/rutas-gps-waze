import {
  type Route,
  type RouteId,
  type RouteInput,
  type RouteUpdate,
  type Tag,
  type TagId,
  type TagInput,
  type TagUpdate,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ROUTES_KEY = ["routes"];
const TAGS_KEY = ["tags"];

/* ----------------------------- Routes ----------------------------- */

export function useRoutes() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ROUTES_KEY,
    queryFn: async (): Promise<Route[]> => {
      if (!actor) return [];
      return actor.listRoutes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRoute(id: RouteId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["route", id?.toString() ?? "none"],
    queryFn: async (): Promise<Route | null> => {
      if (!actor || id === null) return null;
      return actor.getRoute(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useAddRoute() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RouteInput): Promise<RouteId> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addRoute(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROUTES_KEY });
    },
  });
}

export function useUpdateRoute() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      update,
    }: { id: RouteId; update: RouteUpdate }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateRoute(id, update);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROUTES_KEY });
    },
  });
}

export function useDeleteRoute() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: RouteId): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteRoute(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROUTES_KEY });
    },
  });
}

/* ------------------------------ Tags ------------------------------ */

export function useTags() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: async (): Promise<Tag[]> => {
      if (!actor) return [];
      return actor.listTags();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TagInput): Promise<TagId> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addTag(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useUpdateTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, update }: { id: TagId; update: TagUpdate }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateTag(id, update);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useDeleteTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: TagId): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteTag(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}
