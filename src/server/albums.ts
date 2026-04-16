import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { getDb } from '#/db/index.ts'
import { albumPhotos, albums, photos } from '#/db/schema.ts'
import { ensureUserRow, requireUserId } from '#/lib/auth.ts'
import { uniqueSlug } from '#/lib/slug.ts'

const createAlbumInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  visibility: z.enum(['public', 'private']).default('private'),
})

export const createAlbum = createServerFn({ method: 'POST' })
  .inputValidator(createAlbumInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await ensureUserRow(userId)
    const db = getDb(env.DB)
    const id = nanoid()
    const slug = uniqueSlug(data.title)
    await db.insert(albums).values({
      id,
      userId,
      title: data.title,
      slug,
      description: data.description ?? null,
      visibility: data.visibility,
    })
    return { id, slug }
  })

export const listMyAlbums = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()
    const db = getDb(env.DB)
    const rows = await db
      .select({
        id: albums.id,
        title: albums.title,
        slug: albums.slug,
        description: albums.description,
        visibility: albums.visibility,
        coverPhotoId: albums.coverPhotoId,
        createdAt: albums.createdAt,
        updatedAt: albums.updatedAt,
        photoCount: sql<number>`(
          SELECT COUNT(*) FROM album_photos WHERE album_photos.album_id = ${albums.id}
        )`.as('photo_count'),
        coverThumbnailKey: sql<string | null>`(
          SELECT p.thumbnail_key FROM album_photos ap
          JOIN photos p ON p.id = ap.photo_id
          WHERE ap.album_id = ${albums.id}
          ORDER BY ap.sort_order ASC, ap.added_at ASC
          LIMIT 1
        )`.as('cover_thumbnail_key'),
        coverStorageKey: sql<string | null>`(
          SELECT p.storage_key FROM album_photos ap
          JOIN photos p ON p.id = ap.photo_id
          WHERE ap.album_id = ${albums.id}
          ORDER BY ap.sort_order ASC, ap.added_at ASC
          LIMIT 1
        )`.as('cover_storage_key'),
      })
      .from(albums)
      .where(eq(albums.userId, userId))
      .orderBy(desc(albums.createdAt))
    return rows
  },
)

export const getAlbumBySlug = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb(env.DB)
    const [album] = await db
      .select()
      .from(albums)
      .where(and(eq(albums.slug, data.slug), eq(albums.userId, userId)))
      .limit(1)
    if (!album) throw new Error('NOT_FOUND')

    const photoRows = await db
      .select({
        id: photos.id,
        title: photos.title,
        storageKey: photos.storageKey,
        thumbnailKey: photos.thumbnailKey,
        width: photos.width,
        height: photos.height,
        mimeType: photos.mimeType,
        takenAt: photos.takenAt,
        uploadedAt: photos.uploadedAt,
        sortOrder: albumPhotos.sortOrder,
        addedAt: albumPhotos.addedAt,
      })
      .from(albumPhotos)
      .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
      .where(eq(albumPhotos.albumId, album.id))
      .orderBy(albumPhotos.sortOrder, albumPhotos.addedAt)

    return { album, photos: photoRows }
  })

const addPhotosInput = z.object({
  albumId: z.string().min(1),
  photoIds: z.array(z.string().min(1)).min(1).max(500),
})

export const addPhotosToAlbum = createServerFn({ method: 'POST' })
  .inputValidator(addPhotosInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb(env.DB)

    const [album] = await db
      .select({ id: albums.id })
      .from(albums)
      .where(and(eq(albums.id, data.albumId), eq(albums.userId, userId)))
      .limit(1)
    if (!album) throw new Error('ALBUM_NOT_FOUND')

    const ownedPhotos = await db
      .select({ id: photos.id })
      .from(photos)
      .where(
        and(eq(photos.userId, userId), inArray(photos.id, data.photoIds)),
      )
    if (ownedPhotos.length !== data.photoIds.length) {
      throw new Error('FORBIDDEN')
    }

    const rows = data.photoIds.map((photoId) => ({
      albumId: data.albumId,
      photoId,
    }))
    await db.insert(albumPhotos).values(rows).onConflictDoNothing()

    return { inserted: rows.length }
  })
