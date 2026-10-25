import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend behavior lane: installs the app's own compiled canister into the
 * platform's PocketIC replica and calls the real public API. The frontend suite
 * mocks the actor, so it passes unchanged against a canister whose methods are
 * unimplemented stubs; this lane is what proves the canister actually answers.
 *
 * The runner skips the lane cleanly when the wasm or the replica is absent, so
 * a sandbox without PocketIC deploys exactly as it did before this lane existed.
 */
const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const alice = createIdentity("alice");
const bob = createIdentity("bob");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far; a failed
  // `PocketIc.create` otherwise buries the real error under a TypeError.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  actor.setIdentity(alice);
  await expect(actor.listRoutes()).resolves.toEqual([]);
  await expect(actor.listTags()).resolves.toEqual([]);
  await expect(actor.getTravelMode()).resolves.toEqual({ car: null });
});

it("round-trips a route through the real canister", async () => {
  actor.setIdentity(alice);
  const id = await actor.addRoute({
    name: "Riverside loop",
    distanceMeters: 2224,
    durationSeconds: 600n,
    startedAt: 1_700_000_000_000_000_000n,
    endedAt: 1_700_000_600_000_000_000n,
    mode: { car: null },
    points: [
      { lat: 40.4, lng: -3.7, timestamp: 1_700_000_000_000_000_000n },
      { lat: 40.42, lng: -3.7, timestamp: 1_700_000_600_000_000_000n },
    ],
  });

  const routes = await actor.listRoutes();
  expect(routes).toHaveLength(1);
  expect(routes[0]).toMatchObject({
    id,
    name: "Riverside loop",
    distanceMeters: 2224,
    durationSeconds: 600n,
  });
  expect(routes[0].points).toHaveLength(2);

  const fetched = await actor.getRoute(id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0].name).toBe("Riverside loop");

  const updated = await actor.updateRoute(id, {
    name: "Evening loop",
    mode: { bicycle: null },
  });
  expect(updated).toHaveLength(1);
  expect(updated[0]).toMatchObject({ name: "Evening loop", mode: { bicycle: null } });

  await expect(actor.deleteRoute(id)).resolves.toBe(true);
  await expect(actor.listRoutes()).resolves.toEqual([]);
});

it("round-trips a tag through the real canister", async () => {
  actor.setIdentity(alice);
  const id = await actor.addTag({
    category: { pothole: null },
    note: "Pothole on the right lane",
    lat: 40.4168,
    lng: -3.7038,
  });

  const tags = await actor.listTags();
  expect(tags).toHaveLength(1);
  expect(tags[0]).toMatchObject({
    id,
    note: "Pothole on the right lane",
    category: { pothole: null },
    lat: 40.4168,
    lng: -3.7038,
  });

  const updated = await actor.updateTag(id, {
    note: "Filled in",
    category: { note: null },
  });
  expect(updated).toHaveLength(1);
  expect(updated[0]).toMatchObject({ note: "Filled in", category: { note: null } });

  await expect(actor.deleteTag(id)).resolves.toBe(true);
  await expect(actor.listTags()).resolves.toEqual([]);
});

it("persists the caller's travel mode", async () => {
  actor.setIdentity(alice);
  await expect(actor.setTravelMode({ walking: null })).resolves.toEqual({
    walking: null,
  });
  await expect(actor.getTravelMode()).resolves.toEqual({ walking: null });
});

it("does not show one caller's routes or tags to another", async () => {
  actor.setIdentity(alice);
  await actor.addRoute({
    name: "Alice route",
    distanceMeters: 100,
    durationSeconds: 10n,
    startedAt: 1n,
    endedAt: 2n,
    mode: { car: null },
    points: [],
  });
  await actor.addTag({
    category: { hazard: null },
    note: "Alice tag",
    lat: 1,
    lng: 2,
  });

  actor.setIdentity(bob);
  await expect(actor.listRoutes()).resolves.toEqual([]);
  await expect(actor.listTags()).resolves.toEqual([]);
});

it("rejects an anonymous caller", async () => {
  // A freshly created actor calls as the anonymous principal until an identity
  // is set. `pic` is set by `beforeAll`; the optional chain only guards teardown.
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.listRoutes()).rejects.toThrow();
  await expect(
    guest.addTag({ category: { note: null }, note: "nope", lat: 0, lng: 0 }),
  ).rejects.toThrow();
});
