import { parse } from "exifr";

type ImageMeta = {
  width: number;
  height: number;
  takenAt: string | null;
  takenAtOffsetMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  orientation: number | null;
  rawExif: string | null;
};

export const probeDimensions = async (file: File) => {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    const loaded = new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.addEventListener("load", () =>
        resolve({ height: img.naturalHeight, width: img.naturalWidth }),
      );
      img.addEventListener("error", () => reject(new Error("IMAGE_LOAD_FAILED")));
    });
    img.src = url;
    return await loaded;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const zoneOffsetMinutes = (utcMs: number, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(utcMs));
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    pick("hour") % 24,
    pick("minute"),
    pick("second"),
  );
  return (asUtc - utcMs) / 60_000;
};

const zonedTakenAt = (local: Date, timeZone: string) => {
  const naive = Date.UTC(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    local.getHours(),
    local.getMinutes(),
    local.getSeconds(),
  );
  // 夏時間の切り替え前後で 1 時間ずれるため求めたオフセットで解決し直す
  const approximate = naive - zoneOffsetMinutes(naive, timeZone) * 60_000;
  const offsetMinutes = zoneOffsetMinutes(approximate, timeZone);
  return {
    takenAt: new Date(naive - offsetMinutes * 60_000).toISOString(),
    takenAtOffsetMinutes: offsetMinutes,
  };
};

export const extractExif = async (
  file: File,
  timeZone: string,
): Promise<Omit<ImageMeta, "width" | "height">> => {
  try {
    const tags = (await parse(file, {
      exif: true,
      gps: true,
      tiff: true,
    })) as Record<string, unknown> | undefined;
    if (!tags) {
      return emptyExif();
    }
    const localTaken =
      tags.DateTimeOriginal instanceof Date
        ? tags.DateTimeOriginal
        : tags.CreateDate instanceof Date
          ? tags.CreateDate
          : null;
    const zoned = localTaken === null ? null : zonedTakenAt(localTaken, timeZone);
    const { GPSAltitude, FocalLength, ISO, Orientation, ExposureTime } = tags;
    const aperture = tags.FNumber ?? tags.ApertureValue;
    const { latitude, longitude } = tags;
    return {
      altitude:
        typeof GPSAltitude === "number" && Number.isFinite(GPSAltitude) ? GPSAltitude : null,
      aperture: typeof aperture === "number" && Number.isFinite(aperture) ? aperture : null,
      cameraMake: strOrNull(tags.Make),
      cameraModel: strOrNull(tags.Model),
      focalLength:
        typeof FocalLength === "number" && Number.isFinite(FocalLength) ? FocalLength : null,
      iso: typeof ISO === "number" && Number.isFinite(ISO) ? Math.trunc(ISO) : null,
      latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null,
      lensModel: strOrNull(tags.LensModel),
      longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null,
      orientation:
        typeof Orientation === "number" && Number.isFinite(Orientation)
          ? Math.trunc(Orientation)
          : null,
      rawExif: JSON.stringify(tags, (_key: string, value: unknown): unknown => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (value instanceof Uint8Array) {
          return undefined;
        }
        return value;
      }),
      shutterSpeed:
        typeof ExposureTime === "number" && ExposureTime > 0
          ? ExposureTime >= 1
            ? `${ExposureTime}s`
            : `1/${Math.round(1 / ExposureTime)}`
          : null,
      takenAt: zoned?.takenAt ?? null,
      takenAtOffsetMinutes: zoned?.takenAtOffsetMinutes ?? null,
    };
  } catch {
    return emptyExif();
  }
};

const emptyExif = (): Omit<ImageMeta, "width" | "height"> => ({
  altitude: null,
  aperture: null,
  cameraMake: null,
  cameraModel: null,
  focalLength: null,
  iso: null,
  latitude: null,
  lensModel: null,
  longitude: null,
  orientation: null,
  rawExif: null,
  shutterSpeed: null,
  takenAt: null,
  takenAtOffsetMinutes: null,
});

const strOrNull = (v: unknown) => {
  if (typeof v !== "string") {
    return null;
  }
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
};
