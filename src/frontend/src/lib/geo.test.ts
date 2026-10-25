import {
  bearingDegrees,
  buildShareLink,
  haversineMeters,
  parseLatLng,
  pathLengthMeters,
  project,
  unproject,
  whatsappShareUrl,
} from "@/lib/geo";
import { describe, expect, it } from "vitest";

describe("haversineMeters", () => {
  it("returns zero for identical points", () => {
    expect(
      haversineMeters({ lat: 40.4, lng: -3.7 }, { lat: 40.4, lng: -3.7 }),
    ).toBe(0);
  });

  it("measures a known short distance within a metre", () => {
    // ~111.19 m per 0.001 degree of latitude at the equator.
    const meters = haversineMeters({ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 });
    expect(meters).toBeGreaterThan(110);
    expect(meters).toBeLessThan(112);
  });
});

describe("pathLengthMeters", () => {
  it("sums the segments of a polyline", () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0 },
      { lat: 0.002, lng: 0 },
    ];
    const total = pathLengthMeters(points);
    const single = haversineMeters(points[0], points[1]);
    expect(total).toBeCloseTo(single * 2, 5);
  });

  it("is zero for a single point", () => {
    expect(pathLengthMeters([{ lat: 1, lng: 1 }])).toBe(0);
  });
});

describe("bearingDegrees", () => {
  it("reports due north as 0", () => {
    expect(bearingDegrees({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(
      0,
      5,
    );
  });

  it("reports due east as 90", () => {
    expect(bearingDegrees({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(
      90,
      5,
    );
  });
});

describe("project / unproject", () => {
  it("round-trips a coordinate at a given zoom", () => {
    const original = { lat: 40.4168, lng: -3.7038 };
    const { x, y } = project(original.lat, original.lng, 15);
    const back = unproject(x, y, 15);
    expect(back.lat).toBeCloseTo(original.lat, 6);
    expect(back.lng).toBeCloseTo(original.lng, 6);
  });
});

describe("parseLatLng", () => {
  it("parses a valid pair", () => {
    expect(parseLatLng("40.4168", "-3.7038")).toEqual({
      lat: 40.4168,
      lng: -3.7038,
    });
  });

  it("returns null when either value is missing", () => {
    expect(parseLatLng(null, "-3.7038")).toBeNull();
    expect(parseLatLng("40.4168", null)).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseLatLng("north", "-3.7038")).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(parseLatLng("91", "0")).toBeNull();
    expect(parseLatLng("0", "181")).toBeNull();
  });
});

describe("buildShareLink", () => {
  it("encodes the coordinates and an optional label", () => {
    const link = buildShareLink(
      { lat: 40.4168, lng: -3.7038 },
      "Meeting point",
    );
    const url = new URL(link);
    expect(url.searchParams.get("lat")).toBe("40.416800");
    expect(url.searchParams.get("lng")).toBe("-3.703800");
    expect(url.searchParams.get("label")).toBe("Meeting point");
  });

  it("omits the label when it is blank", () => {
    const link = buildShareLink({ lat: 1, lng: 2 }, "   ");
    expect(new URL(link).searchParams.has("label")).toBe(false);
  });
});

describe("whatsappShareUrl", () => {
  it("builds a wa.me intent with the message and link encoded", () => {
    const url = whatsappShareUrl("https://example.com/?lat=1", "I'm here");
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    const text = decodeURIComponent(url.split("text=")[1]);
    expect(text).toContain("I'm here");
    expect(text).toContain("https://example.com/?lat=1");
  });
});
