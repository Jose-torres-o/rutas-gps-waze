import { TagCategory, TravelMode } from "@/backend";
import {
  TAG_CATEGORIES,
  TRAVEL_MODES,
  tagCategoryMeta,
  travelModeMeta,
} from "@/lib/constants";
import { describe, expect, it } from "vitest";

describe("TRAVEL_MODES", () => {
  it("covers all five accepted travel modes", () => {
    const values = TRAVEL_MODES.map((m) => m.value);
    expect(values).toEqual([
      TravelMode.car,
      TravelMode.bus,
      TravelMode.motorcycle,
      TravelMode.bicycle,
      TravelMode.walking,
    ]);
  });

  it("gives every mode a positive average speed", () => {
    for (const mode of TRAVEL_MODES) {
      expect(mode.avgSpeedKmh).toBeGreaterThan(0);
    }
  });

  it("estimates walking as the slowest mode", () => {
    const walking = travelModeMeta(TravelMode.walking).avgSpeedKmh;
    for (const mode of TRAVEL_MODES) {
      expect(walking).toBeLessThanOrEqual(mode.avgSpeedKmh);
    }
  });
});

describe("travelModeMeta", () => {
  it("returns the matching metadata for a mode", () => {
    expect(travelModeMeta(TravelMode.bicycle).label).toBe("Bicycle");
  });

  it("falls back to the first mode for an unknown value", () => {
    expect(travelModeMeta("hovercraft" as TravelMode).value).toBe(
      TravelMode.car,
    );
  });
});

describe("TAG_CATEGORIES", () => {
  it("includes the traffic-signal category used by the signal layer", () => {
    expect(TAG_CATEGORIES.map((c) => c.value)).toContain(
      TagCategory.trafficSignal,
    );
  });

  it("includes pothole, hazard, speed camera and note", () => {
    const values = TAG_CATEGORIES.map((c) => c.value);
    expect(values).toContain(TagCategory.pothole);
    expect(values).toContain(TagCategory.hazard);
    expect(values).toContain(TagCategory.speedCamera);
    expect(values).toContain(TagCategory.note);
  });
});

describe("tagCategoryMeta", () => {
  it("returns the matching metadata for a category", () => {
    expect(tagCategoryMeta(TagCategory.trafficSignal).label).toBe(
      "Traffic signal",
    );
  });

  it("falls back to the note category for an unknown value", () => {
    expect(tagCategoryMeta("unknown" as TagCategory).value).toBe(
      TagCategory.note,
    );
  });
});
