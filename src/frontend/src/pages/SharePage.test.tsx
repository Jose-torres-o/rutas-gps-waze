import { SharePage } from "@/pages/SharePage";
import { installGeolocationMock } from "@/test/geolocation-mock";
import { renderWithQueryClient } from "@/test/render";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

/**
 * SharePage journey: the share link carries the coordinates, and the WhatsApp
 * action opens a prefilled intent. Geolocation is mocked, so the page falls
 * back to the default map centre; the link and intent are still produced.
 */
describe("SharePage", () => {
  let geo: ReturnType<typeof installGeolocationMock>;
  let openSpy: MockInstance<typeof window.open>;

  beforeEach(() => {
    geo = installGeolocationMock();
    openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    window.history.replaceState({}, "", "/share");
  });

  afterEach(() => {
    // Unmount before removing the fake geolocation: the hook's cleanup calls
    // `navigator.geolocation.clearWatch` on unmount.
    cleanup();
    geo.restore();
    openSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("renders the share card with a link containing the coordinates", async () => {
    renderWithQueryClient(<SharePage />);

    expect(screen.getByText("Share this point")).toBeInTheDocument();
    const linkInput = await screen.findByLabelText("Shareable location link");
    const value = (linkInput as HTMLInputElement).value;
    expect(value).toContain("lat=");
    expect(value).toContain("lng=");
  });

  it("opens a WhatsApp intent with the location link prefilled", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SharePage />);

    const linkInput = await screen.findByLabelText("Shareable location link");
    const link = (linkInput as HTMLInputElement).value;

    await user.click(screen.getByTestId("share.whatsapp_button"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url] = openSpy.mock.calls[0];
    expect(String(url).startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(String(url))).toContain(link);
  });

  it("shows the shared-location banner when opened from a shared link", async () => {
    window.history.replaceState(
      {},
      "",
      "/share?lat=40.4168&lng=-3.7038&label=Meet%20here",
    );
    renderWithQueryClient(<SharePage />);

    const banner = await screen.findByTestId("share.shared_banner");
    expect(banner).toHaveTextContent("Meet here");
    expect(banner).toHaveTextContent("40.41680, -3.70380");
  });

  it("copies the link to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderWithQueryClient(<SharePage />);
    const linkInput = await screen.findByLabelText("Shareable location link");
    const link = (linkInput as HTMLInputElement).value;

    await user.click(screen.getByTestId("share.copy_button"));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link));
  });
});
