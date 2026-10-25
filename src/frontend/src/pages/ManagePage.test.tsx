import { ManagePage } from "@/pages/ManagePage";
import {
  type MockBackendActorHandle,
  createMockBackendActor,
  makeRoute,
  makeTag,
} from "@/test/backend-mock";
import { renderWithRouter } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The management panel is the app's add/edit/delete surface for saved routes
 * and tags. These journeys drive the real components against a typed in-memory
 * actor mock, so they exercise the query/mutation wiring and the observable
 * contract the app expects from the canister.
 */
let handle: MockBackendActorHandle;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: handle.actor, isFetching: false }),
}));

describe("ManagePage", () => {
  beforeEach(() => {
    handle = createMockBackendActor({
      routes: [makeRoute({ id: 1n, name: "Morning commute" })],
      tags: [makeTag({ id: 1n, note: "Pothole on the right lane" })],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists saved routes with their stats", async () => {
    renderWithRouter(<ManagePage />, { extraPaths: ["/manage"] });

    const list = await screen.findByTestId("manage.routes.list");
    expect(within(list).getByText("Morning commute")).toBeInTheDocument();
    expect(within(list).getByText("1.20 km")).toBeInTheDocument();
    expect(within(list).getByText("5m 00s")).toBeInTheDocument();
  });

  it("renames a saved route through the edit dialog", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ManagePage />, { extraPaths: ["/manage"] });

    await user.click(await screen.findByTestId("manage.routes.edit_button.1"));
    const nameInput = await screen.findByTestId("manage.route_name_input");
    await user.clear(nameInput);
    await user.type(nameInput, "Evening commute");
    await user.click(screen.getByTestId("manage.route_dialog.save_button"));

    await waitFor(() =>
      expect(handle.actor.updateRoute).toHaveBeenCalledWith(1n, {
        name: "Evening commute",
        mode: "car",
      }),
    );
  });

  it("deletes a saved route after confirmation", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ManagePage />, { extraPaths: ["/manage"] });

    await user.click(
      await screen.findByTestId("manage.routes.delete_button.1"),
    );
    const dialog = await screen.findByTestId("manage.route_delete_dialog");
    await user.click(
      within(dialog).getByTestId("manage.route_delete_dialog.confirm_button"),
    );

    await waitFor(() =>
      expect(handle.actor.deleteRoute).toHaveBeenCalledWith(1n),
    );
  });

  it("lists tags and deletes one after confirmation", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ManagePage />, { extraPaths: ["/manage"] });

    await user.click(await screen.findByTestId("manage.tags.tab"));
    const list = await screen.findByTestId("manage.tags.list");
    expect(
      within(list).getByText("Pothole on the right lane"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("manage.tags.delete_button.1"));
    const dialog = await screen.findByTestId("manage.tag_delete_dialog");
    await user.click(
      within(dialog).getByTestId("manage.tag_delete_dialog.confirm_button"),
    );

    await waitFor(() =>
      expect(handle.actor.deleteTag).toHaveBeenCalledWith(1n),
    );
  });

  it("shows an empty state when there are no routes", async () => {
    handle = createMockBackendActor({ routes: [], tags: [] });
    renderWithRouter(<ManagePage />, { extraPaths: ["/manage"] });

    expect(
      await screen.findByTestId("manage.routes.empty_state"),
    ).toBeInTheDocument();
  });
});
