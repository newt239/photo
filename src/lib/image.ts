import { parse } from "exifr";

type ImageMeta = {
  width: number;
  height: number;
  takenAt: string | null;
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

export const extractExif = async (file: File): Promise<Omit<ImageMeta, "width" | "height">> => {
  try {
    const tags = (await parse(file, {
      exif: true,
      gps: true,
      tiff: true,
    })) as Record<string, unknown> | undefined;
    if (!tags) {
      return emptyExif();
    }
    const takenAt =
      tags.DateTimeOriginal instanceof Date
        ? tags.DateTimeOriginal.toISOString()
        : tags.CreateDate instanceof Date
          ? tags.CreateDate.toISOString()
          : null;
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
      takenAt,
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
});

const strOrNull = (v: unknown) => {
  if (typeof v !== "string") {
    return null;
  }
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
};
