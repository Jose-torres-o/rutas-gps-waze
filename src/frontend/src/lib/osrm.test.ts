import { TravelMode } from "@/backend";
import { fetchOsrmRoutes, osrmProfileForMode } from "@/lib/osrm";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("osrmProfileForMode", () => {
  it("maps bicycle to the cycling profile", () => {
    expect(osrmProfileForMode(TravelMode.bicycle)).toBe("cycling");
  });

  it("maps walking to the walking profile", () => {
    expect(osrmProfileForMode(TravelMode.walking)).toBe("walking");
  });

  it("maps car, bus and motorcycle to the driving profile", () => {
    expect(osrmProfileForMode(TravelMode.car)).toBe("driving");
    expect(osrmProfileForMode(TravelMode.bus)).toBe("driving");
    expect(osrmProfileForMode(TravelMode.motorcycle)).toBe("driving");
  });
});

describe("fetchOsrmRoutes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty array without calling the network for fewer than two points", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const routes = await fetchOsrmRoutes([{ lat: 1, lng: 2 }], "driving");
    expect(routes).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("requests the profile and coordinates and decodes the geometry", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "Ok",
          routes: [
            {
              distance: 1234.5,
              duration: 321,
              geometry: {
                type: "LineString",
                coordinates: [
                  [13.38886, 52.517037],
                  [13.397634, 52.529407],
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const routes = await fetchOsrmRoutes(
      [
        { lat: 52.517037, lng: 13.38886 },
        { lat: 52.529407, lng: 13.397634 },
      ],
      "driving",
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchSpy.mock.calls[0][0]);
    expect(requestedUrl).toContain("/route/v1/driving/");
    expect(requestedUrl).toContain("13.38886,52.517037");
    expect(requestedUrl).toContain("geometries=geojson");

    expect(routes).toHaveLength(1);
    expect(routes[0].distanceMeters).toBe(1234.5);
    expect(routes[0].durationSeconds).toBe(321);
    expect(routes[0].points).toEqual([
      { lat: 52.517037, lng: 13.38886 },
      { lat: 52.529407, lng: 13.397634 },
    ]);
  });

  it("returns an empty array when OSRM reports no route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "NoRoute" }), { status: 200 }),
    );
    const routes = await fetchOsrmRoutes(
      [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
      ],
      "driving",
    );
    expect(routes).toEqual([]);
  });

  it("throws when the routing service responds with an error status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    await expect(
      fetchOsrmRoutes(
        [
          { lat: 0, lng: 0 },
          { lat: 1, lng: 1 },
        ],
        "driving",
      ),
    ).rejects.toThrow(/OSRM request failed/);
  });
});
