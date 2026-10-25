import {
  formatCoords,
  formatDateTime,
  formatDistance,
  formatDuration,
  formatRelative,
  formatSpeed,
  timestampToDate,
} from "@/lib/format";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("timestampToDate", () => {
  it("converts a Motoko nanosecond timestamp to a Date", () => {
    const date = timestampToDate(1_700_000_000_000_000_000n);
    expect(date?.getTime()).toBe(1_700_000_000_000);
  });
});

describe("formatDistance", () => {
  it("renders metres below one kilometre", () => {
    expect(formatDistance(250)).toBe("250 m");
  });

  it("renders kilometres with two decimals under ten", () => {
    expect(formatDistance(1500)).toBe("1.50 km");
  });

  it("renders kilometres with one decimal at ten and above", () => {
    expect(formatDistance(15_000)).toBe("15.0 km");
  });

  it("falls back to zero for invalid input", () => {
    expect(formatDistance(Number.NaN)).toBe("0 m");
    expect(formatDistance(-5)).toBe("0 m");
  });
});

describe("formatDuration", () => {
  it("renders seconds only", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("renders minutes and seconds", () => {
    expect(formatDuration(750)).toBe("12m 30s");
  });

  it("renders hours and padded minutes", () => {
    expect(formatDuration(3840)).toBe("1h 04m");
  });
});

describe("formatSpeed", () => {
  it("converts metres per second to km/h", () => {
    expect(formatSpeed(10)).toBe("36 km/h");
  });

  it("renders a dash when speed is unavailable", () => {
    expect(formatSpeed(null)).toBe("—");
  });
});

describe("formatCoords", () => {
  it("renders five decimal places", () => {
    expect(formatCoords(40.4168, -3.7038)).toBe("40.41680, -3.70380");
  });
});

describe("formatDateTime", () => {
  it("returns a placeholder for a null date", () => {
    expect(formatDateTime(null)).toBe("Unknown time");
  });
});

describe("formatRelative", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels a very recent time as just now", () => {
    expect(formatRelative(new Date("2026-01-01T11:59:58Z"))).toBe("just now");
  });

  it("labels minutes ago", () => {
    expect(formatRelative(new Date("2026-01-01T11:55:00Z"))).toBe("5m ago");
  });

  it("labels hours ago", () => {
    expect(formatRelative(new Date("2026-01-01T09:00:00Z"))).toBe("3h ago");
  });

  it("labels days ago", () => {
    expect(formatRelative(new Date("2025-12-30T12:00:00Z"))).toBe("2d ago");
  });

  it("returns a dash for a null date", () => {
    expect(formatRelative(null)).toBe("—");
  });
});
