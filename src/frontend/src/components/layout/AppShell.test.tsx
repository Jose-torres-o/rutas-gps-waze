import { AppShell } from "@/components/layout/AppShell";
import {
  type MockBackendActorHandle,
  createMockBackendActor,
} from "@/test/backend-mock";
import { installGeolocationMock } from "@/test/geolocation-mock";
import { renderWithRouter } from "@/test/render";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AppShell is the app's default route: the full-screen map shell. These
 * journeys prove the shell renders without a blank screen, shows the
 * OpenStreetMap attribution and the status/dock chrome, records a live path
 * from GPS fixes and saves it as a route, and pins a tag at a tapped point.
 * Geolocation and the backend actor are mocked, so this proves the app's
 * wiring and presentation, not the real canister or device GPS.
 */
let handle: MockBackendActorHandle;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: handle.actor, isFetching: false }),
}));

describe("AppShell", () => {
  let geo: ReturnType<typeof installGeolocationMock>;

  beforeEach(() => {
    handle = createMockBackendActor();
    geo = installGeolocationMock();
  });

  afterEach(() => {
    cleanup();
    geo.restore();
    vi.restoreAllMocks();
  });

  /**
   * The geolocation watch is registered in an effect, so a fix emitted before
   * that effect runs is delivered to nobody. Wait for the watch to exist, then
   * push the fix inside `act` so React flushes the resulting state update.
   */
  async function emitFix(fix: Parameters<typeof geo.emit>[0]) {
    await waitFor(() => expect(geo.started()).toBe(true));
    act(() => geo.emit(fix));
  }

  it("renders the map shell with OpenStreetMap attribution and dock", async () => {
    renderWithRouter(<AppShell />);

    // The map canvas is present, so the default route is not a blank screen.
    expect(await screen.findByTestId("map.canvas_target")).toBeInTheDocument();
    expect(screen.getByTestId("map.attribution_link")).toHaveTextContent(
      "© OpenStreetMap contributors",
    );
    expect(screen.getByTestId("status.strip")).toBeInTheDocument();
    expect(screen.getByTestId("dock.panel")).toBeInTheDocument();
    expect(screen.getByTestId("dock.record_button")).toBeInTheDocument();
  });

  it("shows the live GPS state in the status strip once a fix arrives", async () => {
    renderWithRouter(<AppShell />);

    await emitFix({
      lat: 40.4168,
      lng: -3.7038,
      heading: 90,
      speed: 12,
      accuracy: 6,
      timestamp: Date.now(),
    });

    const strip = await screen.findByTestId("status.strip");
    await waitFor(() => expect(strip).toHaveTextContent("GPS live"));
  });

  it("records a live path and saves it as a route with name, distance and duration", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppShell />);

    // A first fix is required before recording can start.
    await emitFix({
      lat: 40.4,
      lng: -3.7,
      heading: 0,
      speed: 5,
      accuracy: 6,
      timestamp: Date.now(),
    });

    const recordButton = await screen.findByTestId("dock.record_button");
    await waitFor(() => expect(recordButton).toBeEnabled());
    await user.click(recordButton);

    // Move far enough between fixes to append points to the recorded path.
    await emitFix({
      lat: 40.41,
      lng: -3.7,
      heading: 0,
      speed: 5,
      accuracy: 6,
      timestamp: Date.now(),
    });
    await emitFix({
      lat: 40.42,
      lng: -3.7,
      heading: 0,
      speed: 5,
      accuracy: 6,
      timestamp: Date.now(),
    });

    // Stopping opens the save dialog.
    await user.click(screen.getByTestId("dock.record_button"));
    const dialog = await screen.findByTestId("record.save_dialog");
    const nameInput = within(dialog).getByTestId("record.name_input");
    await user.clear(nameInput);
    await user.type(nameInput, "Riverside loop");
    await user.click(within(dialog).getByTestId("record.save_button"));

    await waitFor(() => expect(handle.actor.addRoute).toHaveBeenCalledTimes(1));
    const input = handle.addedRoutes[0];
    expect(input.name).toBe("Riverside loop");
    expect(input.distanceMeters).toBeGreaterThan(0);
    expect(input.durationSeconds).toBeGreaterThanOrEqual(1n);
    expect(input.points.length).toBeGreaterThanOrEqual(2);
    expect(input.points[0]).toHaveProperty("timestamp");
  });

  it("discards an in-progress recording without saving", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppShell />);

    await emitFix({
      lat: 40.4,
      lng: -3.7,
      heading: 0,
      speed: 5,
      accuracy: 6,
      timestamp: Date.now(),
    });

    const recordButton = await screen.findByTestId("dock.record_button");
    await waitFor(() => expect(recordButton).toBeEnabled());
    await user.click(recordButton);

    await user.click(await screen.findByTestId("record.discard_button"));

    expect(screen.queryByTestId("record.save_dialog")).not.toBeInTheDocument();
    expect(handle.actor.addRoute).not.toHaveBeenCalled();
  });

  it("pins a tag at the map centre through the placement flow", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppShell />);

    await emitFix({
      lat: 40.4168,
      lng: -3.7038,
      heading: 0,
      speed: 0,
      accuracy: 6,
      timestamp: Date.now(),
    });

    // Open the tags panel and arm placement.
    await user.click(await screen.findByTestId("dock.tags_button"));
    await user.click(await screen.findByTestId("tags.place_on_map_button"));

    // The "At centre" shortcut captures the current map centre as the point.
    await user.click(await screen.findByTestId("tags.place_center_button"));

    const banner = await screen.findByTestId("tag_placement.banner");
    await user.type(
      within(banner).getByTestId("tag_placement.note_input"),
      "Pothole on the right lane",
    );
    await user.click(within(banner).getByTestId("tag_placement.save_button"));

    await waitFor(() => expect(handle.actor.addTag).toHaveBeenCalledTimes(1));
    const input = handle.addedTags[0];
    expect(input.note).toBe("Pothole on the right lane");
    expect(typeof input.lat).toBe("number");
    expect(typeof input.lng).toBe("number");
  });
});
