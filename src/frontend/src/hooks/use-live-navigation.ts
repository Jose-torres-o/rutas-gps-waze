import type { Route, TravelMode } from "@/backend";
import { useGeolocation } from "@/hooks/use-geolocation";
import { haversineMeters, pathLengthMeters } from "@/lib/geo";
import {
  type OsrmRoute,
  fetchOsrmRoutes,
  osrmProfileForMode,
} from "@/lib/osrm";
import type { GeoFix, LatLng } from "@/types/app";
import { useEffect, useMemo, useRef, useState } from "react";

/** Distance (metres) from the route within which the user counts as on-route. */
const ON_ROUTE_THRESHOLD_M = 40;

/** How often the live position is re-evaluated against the route. */
const POLL_INTERVAL_MS = 3_000;

export interface RouteProgress {
  /** Fraction of the route travelled, 0–1. */
  fraction: number;
  /** Metres travelled along the route. */
  traveledMeters: number;
  /** Metres still to travel. */
  remainingMeters: number;
  /** Perpendicular distance from the live position to the route, in metres. */
  offsetMeters: number;
  /** Index of the route segment the user is currently nearest to. */
  segmentIndex: number;
}

export interface JoinOption {
  id: string;
  /** Metres from the live position to the point where the route is joined. */
  distanceMeters: number;
  /** Estimated seconds to reach the route. */
  durationSeconds: number;
  /** Path from the live position to the join point. */
  points: LatLng[];
  /** Where the join path meets the saved route. */
  joinPoint: LatLng;
  /** Progress along the saved route at the join point, 0–1. */
  joinFraction: number;
}

export interface LiveNavigationState {
  fix: GeoFix | null;
  /** True while the browser is acquiring or has a live fix. */
  tracking: boolean;
  /** True when the live position is within the on-route threshold. */
  onRoute: boolean;
  progress: RouteProgress | null;
  joinOptions: JoinOption[];
  /** True while join routes are being fetched from OSRM. */
  loadingJoins: boolean;
  /** Human-readable error from the routing service, when it fails. */
  joinError: string | null;
  /** Epoch ms of the most recent position update. */
  lastUpdated: number | null;
}

interface NearestOnRoute {
  offsetMeters: number;
  segmentIndex: number;
  /** Distance along the route to the nearest point, in metres. */
  alongMeters: number;
  point: LatLng;
}

/** Project a point onto a segment, returning the closest point and its ratio. */
function projectOnSegment(
  p: LatLng,
  a: LatLng,
  b: LatLng,
): { point: LatLng; ratio: number } {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = p.lng;
  const py = p.lat;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return { point: a, ratio: 0 };
  let ratio = ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  ratio = Math.max(0, Math.min(1, ratio));
  return { point: { lat: ay + ratio * dy, lng: ax + ratio * dx }, ratio };
}

/** Find the nearest point on a polyline to `p`, with cumulative distance. */
function nearestOnPath(p: LatLng, path: LatLng[]): NearestOnRoute | null {
  if (path.length < 2) return null;
  let best: NearestOnRoute | null = null;
  let cumulative = 0;
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const segmentLength = haversineMeters(a, b);
    const { point, ratio } = projectOnSegment(p, a, b);
    const offset = haversineMeters(p, point);
    if (!best || offset < best.offsetMeters) {
      best = {
        offsetMeters: offset,
        segmentIndex: i - 1,
        alongMeters: cumulative + segmentLength * ratio,
        point,
      };
    }
    cumulative += segmentLength;
  }
  return best;
}

/**
 * Live navigation against a selected saved route. Continuously tracks the
 * device's real position (never playback), reports travelled progress while
 * on-route, and computes OSRM join paths while off-route.
 */
export function useLiveNavigation(
  route: Route | null,
  mode: TravelMode,
): LiveNavigationState {
  const { fix, status } = useGeolocation({ watch: true });
  const [joinOptions, setJoinOptions] = useState<JoinOption[]>([]);
  const [loadingJoins, setLoadingJoins] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const routePoints = useMemo<LatLng[]>(
    () => (route ? route.points.map((p) => ({ lat: p.lat, lng: p.lng })) : []),
    [route],
  );

  const totalMeters = useMemo(
    () => pathLengthMeters(routePoints),
    [routePoints],
  );

  /* Record the timestamp of each fresh fix for the last-updated indicator. */
  useEffect(() => {
    if (fix) setLastUpdated(fix.timestamp);
  }, [fix]);

  const progress = useMemo<RouteProgress | null>(() => {
    if (!fix || routePoints.length < 2 || totalMeters <= 0) return null;
    const nearest = nearestOnPath({ lat: fix.lat, lng: fix.lng }, routePoints);
    if (!nearest) return null;
    const traveled = Math.min(nearest.alongMeters, totalMeters);
    return {
      fraction: totalMeters > 0 ? traveled / totalMeters : 0,
      traveledMeters: traveled,
      remainingMeters: Math.max(0, totalMeters - traveled),
      offsetMeters: nearest.offsetMeters,
      segmentIndex: nearest.segmentIndex,
    };
  }, [fix, routePoints, totalMeters]);

  const onRoute =
    progress !== null && progress.offsetMeters <= ON_ROUTE_THRESHOLD_M;

  /* Fetch join routes whenever the user is off-route. */
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!route || !fix || routePoints.length < 2) {
      setJoinOptions([]);
      setJoinError(null);
      setLoadingJoins(false);
      return;
    }
    if (onRoute) {
      setJoinOptions([]);
      setJoinError(null);
      setLoadingJoins(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setLoadingJoins(true);
    setJoinError(null);

    const profile = osrmProfileForMode(mode);
    const origin: LatLng = { lat: fix.lat, lng: fix.lng };

    /* Candidate join points spread along the saved route. */
    const candidates: { point: LatLng; fraction: number }[] = [];
    const step = Math.max(1, Math.floor(routePoints.length / 8));
    for (let i = 0; i < routePoints.length; i += step) {
      candidates.push({
        point: routePoints[i],
        fraction: totalMeters > 0 ? i / (routePoints.length - 1) : 0,
      });
    }
    const last = routePoints[routePoints.length - 1];
    if (candidates[candidates.length - 1]?.point !== last) {
      candidates.push({ point: last, fraction: 1 });
    }

    /* Rank candidates by straight-line distance and probe the closest few. */
    const ranked = candidates
      .map((c) => ({ ...c, straight: haversineMeters(origin, c.point) }))
      .sort((a, b) => a.straight - b.straight)
      .slice(0, 3);

    const run = async () => {
      try {
        const results = await Promise.all(
          ranked.map(async (candidate) => {
            const routes = await fetchOsrmRoutes(
              [origin, candidate.point],
              profile,
              1,
              controller.signal,
            );
            const best = routes[0];
            if (!best) return null;
            return {
              id: `${candidate.fraction.toFixed(3)}-${candidate.point.lat.toFixed(4)}`,
              distanceMeters: best.distanceMeters,
              durationSeconds: best.durationSeconds,
              points: best.points,
              joinPoint: candidate.point,
              joinFraction: candidate.fraction,
            } satisfies JoinOption;
          }),
        );
        if (controller.signal.aborted) return;
        const options = results
          .filter((r): r is JoinOption => r !== null)
          .sort((a, b) => a.durationSeconds - b.durationSeconds);
        setJoinOptions(options);
        setJoinError(
          options.length === 0
            ? "No join route found from your position."
            : null,
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setJoinOptions([]);
        setJoinError(
          error instanceof Error
            ? error.message
            : "Could not reach the routing service.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingJoins(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [route, fix, routePoints, totalMeters, onRoute, mode]);

  /* Re-evaluate on a fixed cadence so the last-updated indicator stays fresh. */
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!route) return;
    const id = window.setInterval(
      () => forceTick((n) => n + 1),
      POLL_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [route]);

  return {
    fix,
    tracking: status === "live" || status === "locating",
    onRoute,
    progress,
    joinOptions,
    loadingJoins,
    joinError,
    lastUpdated,
  };
}
