import { z } from "zod";

type TimelineSample = {
  readonly at: number;
  readonly latitude: number;
  readonly longitude: number;
};

type TimelineVisit = {
  readonly start: number;
  readonly end: number;
  readonly latitude: number;
  readonly longitude: number;
};

export type Timeline = {
  readonly samples: readonly TimelineSample[];
  readonly visits: readonly TimelineVisit[];
};

export type TimelineMatch = {
  readonly latitude: number;
  readonly longitude: number;
  readonly diffMs: number;
  readonly source: "visit" | "interpolated" | "nearest";
};

const placeSchema = z.union([z.string(), z.object({ latLng: z.string().optional() })]).optional();

const pathStepSchema = z
  .object({
    durationMinutesOffsetFromStartTime: z.string().optional(),
    point: z.string().optional(),
    time: z.string().optional(),
  })
  .catch({});

const segmentSchema = z
  .object({
    activity: z.object({ end: placeSchema, start: placeSchema }).optional(),
    endTime: z.string().optional(),
    startTime: z.string().optional(),
    timelinePath: z.array(pathStepSchema).optional(),
    visit: z
      .object({ topCandidate: z.object({ placeLocation: placeSchema }).optional() })
      .optional(),
  })
  .catch({});

const rawSignalSchema = z
  .object({
    position: z
      .object({
        LatLng: z.string().optional(),
        latLng: z.string().optional(),
        timestamp: z.string().optional(),
      })
      .optional(),
  })
  .catch({});

const timelineFileSchema = z.union([
  z.array(segmentSchema),
  z.object({
    rawSignals: z.array(rawSignalSchema).optional(),
    semanticSegments: z.array(segmentSchema).optional(),
  }),
]);

const readCoordinate = (
  value?: string | { latLng?: string },
): { latitude: number; longitude: number } | null => {
  const text = typeof value === "string" ? value : value?.latLng;
  if (!text) {
    return null;
  }
  const parts = text
    .replace("geo:", "")
    .replaceAll("°", "")
    .trim()
    .split(/[,\s]+/);
  if (parts.length < 2) {
    return null;
  }
  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }
  if (latitude === 0 && longitude === 0) {
    return null;
  }
  return { latitude, longitude };
};

const toEpoch = (value?: string): number | null => {
  if (!value) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
};

const offsetFrom = (startMs: number | null, minutes?: string): number | null => {
  if (startMs === null || !minutes) {
    return null;
  }
  const value = Number(minutes);
  return Number.isFinite(value) ? startMs + value * 60_000 : null;
};

export const parseTimeline = (text: string): Timeline => {
  const parsed = timelineFileSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error("タイムラインのデータ形式を判別できませんでした");
  }
  const segments = Array.isArray(parsed.data) ? parsed.data : (parsed.data.semanticSegments ?? []);
  const rawSignals = Array.isArray(parsed.data) ? [] : (parsed.data.rawSignals ?? []);

  const samples: TimelineSample[] = [];
  const visits: TimelineVisit[] = [];

  for (const segment of segments) {
    const start = toEpoch(segment.startTime);
    const end = toEpoch(segment.endTime);

    const visitPoint = readCoordinate(segment.visit?.topCandidate?.placeLocation);
    if (visitPoint && start !== null && end !== null) {
      visits.push({ end, latitude: visitPoint.latitude, longitude: visitPoint.longitude, start });
      samples.push(
        { at: start, latitude: visitPoint.latitude, longitude: visitPoint.longitude },
        { at: end, latitude: visitPoint.latitude, longitude: visitPoint.longitude },
      );
    }

    for (const step of segment.timelinePath ?? []) {
      const point = readCoordinate(step.point);
      const at = toEpoch(step.time) ?? offsetFrom(start, step.durationMinutesOffsetFromStartTime);
      if (point && at !== null) {
        samples.push({ at, latitude: point.latitude, longitude: point.longitude });
      }
    }

    const activityStart = readCoordinate(segment.activity?.start);
    if (activityStart && start !== null) {
      samples.push({
        at: start,
        latitude: activityStart.latitude,
        longitude: activityStart.longitude,
      });
    }
    const activityEnd = readCoordinate(segment.activity?.end);
    if (activityEnd && end !== null) {
      samples.push({ at: end, latitude: activityEnd.latitude, longitude: activityEnd.longitude });
    }
  }

  for (const signal of rawSignals) {
    const point = readCoordinate(signal.position?.LatLng ?? signal.position?.latLng);
    const at = toEpoch(signal.position?.timestamp);
    if (point && at !== null) {
      samples.push({ at, latitude: point.latitude, longitude: point.longitude });
    }
  }

  samples.sort((a, b) => a.at - b.at);
  visits.sort((a, b) => a.start - b.start);
  return { samples, visits };
};

const findVisit = (visits: readonly TimelineVisit[], atMs: number): TimelineVisit | null => {
  let low = 0;
  let high = visits.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const visit = visits[mid];
    if (visit && visit.start <= atMs) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  const candidate = visits[low - 1];
  return candidate && candidate.end >= atMs ? candidate : null;
};

const lowerBound = (samples: readonly TimelineSample[], atMs: number): number => {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const sample = samples[mid];
    if (sample && sample.at < atMs) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};

export const matchTimeline = (
  timeline: Timeline,
  atMs: number,
  toleranceMs: number,
): TimelineMatch | null => {
  const visit = findVisit(timeline.visits, atMs);
  if (visit) {
    return {
      diffMs: 0,
      latitude: visit.latitude,
      longitude: visit.longitude,
      source: "visit",
    };
  }

  const index = lowerBound(timeline.samples, atMs);
  const next = timeline.samples[index] ?? null;
  const prev = index > 0 ? (timeline.samples[index - 1] ?? null) : null;
  const prevDiff = prev ? atMs - prev.at : Number.POSITIVE_INFINITY;
  const nextDiff = next ? next.at - atMs : Number.POSITIVE_INFINITY;

  if (prev && next && prevDiff <= toleranceMs && nextDiff <= toleranceMs) {
    const span = next.at - prev.at;
    const ratio = span > 0 ? (atMs - prev.at) / span : 0;
    return {
      diffMs: Math.min(prevDiff, nextDiff),
      latitude: prev.latitude + (next.latitude - prev.latitude) * ratio,
      longitude: prev.longitude + (next.longitude - prev.longitude) * ratio,
      source: "interpolated",
    };
  }
  if (prev && prevDiff <= toleranceMs && prevDiff <= nextDiff) {
    return {
      diffMs: prevDiff,
      latitude: prev.latitude,
      longitude: prev.longitude,
      source: "nearest",
    };
  }
  if (next && nextDiff <= toleranceMs) {
    return {
      diffMs: nextDiff,
      latitude: next.latitude,
      longitude: next.longitude,
      source: "nearest",
    };
  }
  return null;
};
