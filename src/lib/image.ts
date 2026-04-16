import exifr from 'exifr'

export type ImageMeta = {
  width: number
  height: number
  takenAt: string | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  cameraMake: string | null
  cameraModel: string | null
  lensModel: string | null
  focalLength: number | null
  aperture: number | null
  shutterSpeed: string | null
  iso: number | null
  orientation: number | null
  rawExif: string | null
}

export async function probeDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    const loaded = new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'))
      },
    )
    img.src = url
    return await loaded
  } finally {
    URL.revokeObjectURL(url)
  }
}

function formatShutter(value: unknown): string | null {
  if (typeof value !== 'number' || value <= 0) return null
  if (value >= 1) return `${value}s`
  const reciprocal = Math.round(1 / value)
  return `1/${reciprocal}`
}

export async function extractExif(
  file: File,
): Promise<Omit<ImageMeta, 'width' | 'height'>> {
  try {
    const tags = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
    })) as Record<string, unknown> | undefined
    if (!tags) {
      return emptyExif()
    }
    const takenAt =
      tags.DateTimeOriginal instanceof Date
        ? tags.DateTimeOriginal.toISOString()
        : tags.CreateDate instanceof Date
          ? (tags.CreateDate as Date).toISOString()
          : null
    return {
      takenAt,
      latitude: numOrNull(tags.latitude),
      longitude: numOrNull(tags.longitude),
      altitude: numOrNull(tags.GPSAltitude),
      cameraMake: strOrNull(tags.Make),
      cameraModel: strOrNull(tags.Model),
      lensModel: strOrNull(tags.LensModel),
      focalLength: numOrNull(tags.FocalLength),
      aperture: numOrNull(tags.FNumber ?? tags.ApertureValue),
      shutterSpeed: formatShutter(tags.ExposureTime),
      iso: intOrNull(tags.ISO),
      orientation: intOrNull(tags.Orientation),
      rawExif: JSON.stringify(tags, replaceDates),
    }
  } catch {
    return emptyExif()
  }
}

function emptyExif(): Omit<ImageMeta, 'width' | 'height'> {
  return {
    takenAt: null,
    latitude: null,
    longitude: null,
    altitude: null,
    cameraMake: null,
    cameraModel: null,
    lensModel: null,
    focalLength: null,
    aperture: null,
    shutterSpeed: null,
    iso: null,
    orientation: null,
    rawExif: null,
  }
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function intOrNull(v: unknown): number | null {
  const n = numOrNull(v)
  return n === null ? null : Math.trunc(n)
}
function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}
function replaceDates(_key: string, value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Uint8Array) return undefined
  return value
}

export async function generateThumbnail(
  file: File,
  maxEdge = 1024,
  quality = 0.82,
): Promise<Blob | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'))
      img.src = url
    })
    const { naturalWidth: w, naturalHeight: h } = img
    const scale = Math.min(1, maxEdge / Math.max(w, h))
    const tw = Math.round(w * scale)
    const th = Math.round(h * scale)
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, tw, th)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', quality),
    )
    return blob
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
