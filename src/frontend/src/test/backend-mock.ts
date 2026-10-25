import type {
  Route,
  RouteId,
  RouteInput,
  RouteUpdate,
  Tag,
  TagCategory,
  TagId,
  TagInput,
  TagUpdate,
  TravelMode,
} from "@/backend";
import { TravelMode as TravelModeEnum } from "@/backend";
import type { GeoFix } from "@/types/app";
import { vi } from "vitest";

/**
 * A typed in-memory stand-in for the generated `Backend` actor. It implements
 * the same public surface the app's hooks call, so component journeys exercise
 * real query/mutation wiring without a canister. It is a mock: nothing here
 * proves the Motoko canister behaves this way.
 */
export interface MockBackendActor {
  listRoutes: () => Promise<Route[]>;
  getRoute: (id: RouteId) => Promise<Route | null>;
  addRoute: (input: RouteInput) => Promise<RouteId>;
  updateRoute: (id: RouteId, update: RouteUpdate) => Promise<Route | null>;
  deleteRoute: (id: RouteId) => Promise<boolean>;
  listTags: () => Promise<Tag[]>;
  getTag: (id: TagId) => Promise<Tag | null>;
  addTag: (input: TagInput) => Promise<TagId>;
  updateTag: (id: TagId, update: TagUpdate) => Promise<Tag | null>;
  deleteTag: (id: TagId) => Promise<boolean>;
  getTravelMode: () => Promise<TravelMode>;
  setTravelMode: (mode: TravelMode) => Promise<TravelMode>;
}

export interface MockBackendSeed {
  routes?: Route[];
  tags?: Tag[];
  travelMode?: TravelMode;
}

export interface MockBackendActorHandle {
  actor: MockBackendActor;
  /** Every `addRoute` input the app submitted, in order. */
  addedRoutes: RouteInput[];
  /** Every `addTag` input the app submitted, in order. */
  addedTags: TagInput[];
  /** Every `setTravelMode` value the app submitted, in order. */
  setModes: TravelMode[];
  /** Every route id passed to `deleteRoute`. */
  deletedRouteIds: RouteId[];
  /** Every tag id passed to `deleteTag`. */
  deletedTagIds: TagId[];
}

const OWNER = "aaaaa-aa" as unknown as Route["owner"];

/**
 * Build a mock actor seeded with the given routes, tags and travel mode. The
 * returned handle records the mutations the app performs so tests can assert on
 * the observable contract rather than on internal state.
 */
export function createMockBackendActor(
  seed: MockBackendSeed = {},
): MockBackendActorHandle {
  const routes = new Map<RouteId, Route>(seed.routes?.map((r) => [r.id, r]));
  const tags = new Map<TagId, Tag>(seed.tags?.map((t) => [t.id, t]));
  let travelMode: TravelMode = seed.travelMode ?? TravelModeEnum.car;
  let nextRouteId = BigInt(routes.size + 1);
  let nextTagId = BigInt(tags.size + 1);

  const addedRoutes: RouteInput[] = [];
  const addedTags: TagInput[] = [];
  const setModes: TravelMode[] = [];
  const deletedRouteIds: RouteId[] = [];
  const deletedTagIds: TagId[] = [];

  const actor: MockBackendActor = {
    listRoutes: vi.fn(async () => [...routes.values()]),
    getRoute: vi.fn(async (id) => routes.get(id) ?? null),
    addRoute: vi.fn(async (input) => {
      addedRoutes.push(input);
      const id = nextRouteId;
      nextRouteId += 1n;
      routes.set(id, {
        id,
        owner: OWNER,
        name: input.name,
        distanceMeters: input.distanceMeters,
        durationSeconds: input.durationSeconds,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        mode: input.mode,
        points: input.points,
      });
      return id;
    }),
    updateRoute: vi.fn(async (id, update) => {
      const existing = routes.get(id);
      if (!existing) return null;
      const next: Route = { ...existing, name: update.name, mode: update.mode };
      routes.set(id, next);
      return next;
    }),
    deleteRoute: vi.fn(async (id) => {
      deletedRouteIds.push(id);
      return routes.delete(id);
    }),
    listTags: vi.fn(async () => [...tags.values()]),
    getTag: vi.fn(async (id) => tags.get(id) ?? null),
    addTag: vi.fn(async (input) => {
      addedTags.push(input);
      const id = nextTagId;
      nextTagId += 1n;
      tags.set(id, {
        id,
        owner: OWNER,
        lat: input.lat,
        lng: input.lng,
        note: input.note,
        category: input.category,
        createdAt: 1_700_000_000_000_000_000n,
      });
      return id;
    }),
    updateTag: vi.fn(async (id, update) => {
      const existing = tags.get(id);
      if (!existing) return null;
      const next: Tag = {
        ...existing,
        note: update.note,
        category: update.category,
      };
      tags.set(id, next);
      return next;
    }),
    deleteTag: vi.fn(async (id) => {
      deletedTagIds.push(id);
      return tags.delete(id);
    }),
    getTravelMode: vi.fn(async () => travelMode),
    setTravelMode: vi.fn(async (mode) => {
      setModes.push(mode);
      travelMode = mode;
      return mode;
    }),
  };

  return {
    actor,
    addedRoutes,
    addedTags,
    setModes,
    deletedRouteIds,
    deletedTagIds,
  };
}

/** Build a saved route fixture with sensible defaults. */
export function makeRoute(overrides: Partial<Route> = {}): Route {
  const startedAt = overrides.startedAt ?? 1_700_000_000_000_000_000n;
  return {
    id: 1n,
    owner: OWNER,
    name: "Morning commute",
    distanceMeters: 1200,
    durationSeconds: 300n,
    startedAt,
    endedAt: startedAt + 300_000_000_000n,
    mode: TravelModeEnum.car,
    points: [
      { lat: 40.4168, lng: -3.7038, timestamp: startedAt },
      { lat: 40.42, lng: -3.7, timestamp: startedAt + 1_000_000_000n },
      { lat: 40.425, lng: -3.695, timestamp: startedAt + 2_000_000_000n },
    ],
    ...overrides,
  };
}

/** Build a saved tag fixture with sensible defaults. */
export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 1n,
    owner: OWNER,
    lat: 40.4168,
    lng: -3.7038,
    note: "Pothole on the right lane",
    category: "pothole" as TagCategory,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/** Build a live GPS fix fixture. */
export function makeFix(overrides: Partial<GeoFix> = {}): GeoFix {
  return {
    lat: 40.4168,
    lng: -3.7038,
    heading: 90,
    speed: 12,
    accuracy: 8,
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}
