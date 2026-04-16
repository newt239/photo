import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { getDb } from '#/db/index.ts'
import { photos } from '#/db/schema.ts'
import { ensureUserRow, requireUserId } from '#/lib/auth.ts'
import {
  buildOriginalKey,
  buildThumbnailKey,
  keyOwnerId,
  signPutUrl,
} from '#/server/storage.ts'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/gif',
] as const

const THUMB_MIME = 'image/webp'
const MAX_FILE_SIZE = 50 * 1024 * 1024

const createPhotoUploadInput = z.object({
  contentType: z.enum(ALLOWED_MIME),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
  hasThumbnail: z.boolean().default(true),
})

export const createPhotoUpload = createServerFn({ method: 'POST' })
  .inputValidator(createPhotoUploadInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await ensureUserRow(userId)
    const photoId = nanoid()
    const originalKey = buildOriginalKey(userId, photoId, data.contentType)
    const originalUrl = await signPutUrl(originalKey, data.contentType)
    let thumbnailKey: string | null = null
    let thumbnailUrl: string | null = null
    if (data.hasThumbnail) {
      thumbnailKey = buildThumbnailKey(userId, photoId)
      thumbnailUrl = await signPutUrl(thumbnailKey, THUMB_MIME)
    }
    return {
      photoId,
      originalKey,
      thumbnailKey,
      originalUrl,
      thumbnailUrl,
    }
  })

const finalizePhotoInput = z.object({
  photoId: z.string().min(1),
  originalKey: z.string().min(1),
  thumbnailKey: z.string().nullable(),
  title: z.string().max(200).nullable().optional(),
  mimeType: z.enum(ALLOWED_MIME),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  takenAt: z.string().datetime().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  cameraMake: z.string().nullable().optional(),
  cameraModel: z.string().nullable().optional(),
  lensModel: z.string().nullable().optional(),
  focalLength: z.number().nullable().optional(),
  aperture: z.number().nullable().optional(),
  shutterSpeed: z.string().nullable().optional(),
  iso: z.number().int().nullable().optional(),
  orientation: z.number().int().nullable().optional(),
  rawExif: z.string().nullable().optional(),
})

export const finalizePhoto = createServerFn({ method: 'POST' })
  .inputValidator(finalizePhotoInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    if (keyOwnerId(data.originalKey) !== userId) {
      throw new Error('FORBIDDEN')
    }
    if (data.thumbnailKey && keyOwnerId(data.thumbnailKey) !== userId) {
      throw new Error('FORBIDDEN')
    }

    const head = await env.MY_BUCKET.head(data.originalKey)
    if (!head) {
      throw new Error('UPLOAD_NOT_FOUND')
    }

    try {
      const db = getDb(env.DB)
      await db.insert(photos).values({
        id: data.photoId,
        userId,
        title: data.title ?? null,
        storageKey: data.originalKey,
        thumbnailKey: data.thumbnailKey,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        visibility: 'private',
        takenAt: data.takenAt ? new Date(data.takenAt) : null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        altitude: data.altitude ?? null,
        cameraMake: data.cameraMake ?? null,
        cameraModel: data.cameraModel ?? null,
        lensModel: data.lensModel ?? null,
        focalLength: data.focalLength ?? null,
        aperture: data.aperture ?? null,
        shutterSpeed: data.shutterSpeed ?? null,
        iso: data.iso ?? null,
        orientation: data.orientation ?? null,
        rawExif: data.rawExif ?? null,
      })
    } catch (e) {
      await env.MY_BUCKET.delete(data.originalKey).catch(() => {})
      if (data.thumbnailKey) {
        await env.MY_BUCKET.delete(data.thumbnailKey).catch(() => {})
      }
      throw e
    }

    return { id: data.photoId }
  })

export const listMyPhotos = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()
    const db = getDb(env.DB)
    const rows = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, userId))
      .orderBy(desc(photos.uploadedAt))
      .limit(200)
    return rows
  },
)

export const getPhoto = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb(env.DB)
    const [row] = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1)
    if (!row) throw new Error('NOT_FOUND')
    return row
  })
