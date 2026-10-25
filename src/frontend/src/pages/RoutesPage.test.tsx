import { RoutesPage } from "@/pages/RoutesPage";
import {
  type MockBackendActorHandle,
  createMockBackendActor,
  makeRoute,
} from "@/test/backend-mock";
import { installGeolocationMock } from "@/test/geolocation-mock";
import { renderWithRouter } from "@/test/render";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * RoutesPage journey: the saved-routes list, selecting a route for live
 * tracking, on-route progress, and off-route join options. Geolocation and the
 * OSRM routing service are mocked, so this proves the app's wiring and
 * presentation, not the real routing service.
 */
let handle: MockBackendActorHandle;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: handle.actor, isFetching: false }),
}));

/** A route running due north along a meridian, ~2.2 km long. */
const ROUTE = makeRoute({
  id: 7n,
  name: "Riverside loop",
  distanceMeters: 2224,
  durationSeconds: 600n,
  points: [
    { lat: 40.4, lng: -3.7, timestamp: 1_700_000_000_000_000_000n },
    { lat: 40.41, lng: -3.7, timestamp: 1_700_000_001_000_000_000n },
    { lat: 40.42, lng: -3.7, timestamp: 1_700_000_002_000_000_000n },
  ],
});

function osrmResponse(distance: number, duration: number) {
  return new Response(
    JSON.stringify({
      code: "Ok",
      routes: [
        {
          distance,
          duration,
          geometry: {
            type: "LineString",
            coordinates: [
              [-3.71, 40.39],
              [-3.7, 40.4],
            ],
          },
        },
      ],
    }),
    { status: 200 },
  );
}

describe("RoutesPage", () => {
  let geo: ReturnType<typeof installGeolocationMock>;

  beforeEach(() => {
    handle = createMockBackendActor({ routes: [ROUTE] });
    geo = installGeolocationMock();
  });

  afterEach(() => {
    cleanup();
    geo.restore();
    vi.restoreAllMocks();
  });

  it("lists saved routes with name, distance and duration", async () => {
    renderWithRouter(<RoutesPage onBack={() => {}} onOpenOnMap={() => {}} />);

    const list = await screen.findByTestId("routes.list");
    expect(within(list).getByText("Riverside loop")).toBeInTheDocument();
    expect(within(list).getByText("2.22 km")).toBeInTheDocument();
    expect(within(list).getByText("10m 00s")).toBeInTheDocument();
  });

  it("opens the selected route on the map", async () => {
    const user = userEvent.setup();
    const onOpenOnMap = vi.fn();
    renderWithRouter(
      <RoutesPage onBack={() => {}} onOpenOnMap={onOpenOnMap} />,
    );

    await user.click(await screen.findByTestId("routes.select_button.1"));
    expect(onOpenOnMap).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7n, name: "Riverside loop" }),
    );
  });

  it("shows live travelled progress when the user is on the route", async () => {
    const user = userEvent.setup();
    renderWithRouter(<RoutesPage onBack={() => {}} onOpenOnMap={() => {}} />);

    await user.click(await screen.findByTestId("routes.select_button.1"));
    // A fix sitting exactly on the route, roughly halfway along it.
    act(() =>
      geo.emit({
        lat: 40.41,
        lng: -3.7,
        heading: 0,
        speed: 5,
        accuracy: 6,
        timestamp: Date.now(),
      }),
    );

    const onRoute = await screen.findByTestId("navigation.on_route_state");
    expect(onRoute).toHaveTextContent("On route");
    const progress = await screen.findByTestId("navigation.progress");
    expect(progress).toHaveTextContent("%");
    expect(progress).toHaveTextContent("travelled");
    expect(progress).toHaveTextContent("left");
  });

  it("offers a join path with distance and ETA when the user is off the route", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => osrmResponse(850, 120));

    renderWithRouter(<RoutesPage onBack={() => {}} onOpenOnMap={() => {}} />);

    await user.click(await screen.findByTestId("routes.select_button.1"));
    // A fix well away from the route (about 1 km east).
    act(() =>
      geo.emit({
        lat: 40.41,
        lng: -3.688,
        heading: 0,
        speed: 0,
        accuracy: 6,
        timestamp: Date.now(),
      }),
    );

    const offRoute = await screen.findByTestId("navigation.off_route_state");
    expect(offRoute).toHaveTextContent("Off route");

    const joinList = await screen.findByTestId("join.list");
    const firstOption = within(joinList).getByTestId("join.option.1");
    expect(firstOption).toHaveTextContent("850 m");
    expect(firstOption).toHaveTextContent("2m 00s");
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("shows an empty state when no routes are saved", async () => {
    handle = createMockBackendActor({ routes: [] });
    renderWithRouter(<RoutesPage onBack={() => {}} onOpenOnMap={() => {}} />);

    expect(await screen.findByTestId("routes.empty_state")).toBeInTheDocument();
  });
});
