import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { z } from "zod";

import * as schema from "#/db/schema.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";
import { ensureUserRow, requireUserId } from "#/lib/auth.ts";

const createAlbumInput = z.object({
  description: z.string().max(2000).nullable().optional(),
  title: z.string().min(1).max(200),
  visibility: z.enum(["public", "private"]).default("private"),
});

export const createAlbum = createServerFn({ method: "POST" })
  .validator(createAlbumInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    await ensureUserRow(userId);
    const db = drizzle(env.DB, { schema });
    const id = nanoid();
    const normalized = data.title
      .normalize("NFKD")
      .replaceAll(/[\u0300-\u036F]/g, "")
      .toLowerCase()
      .replaceAll(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, "-")
      .replaceAll(/^-+|-+$/g, "");
    const slug = `${normalized || "album"}-${nanoid(6)}`;
    await db.insert(albums).values({
      description: data.description ?? null,
      id,
      slug,
      title: data.title,
      userId,
      visibility: data.visibility,
    });
    return { id, slug };
  });

const updateAlbumInput = z.object({
  description: z.string().max(2000).nullable(),
  id: z.string().min(1),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  visibility: z.enum(["public", "private"]),
});

export const updateAlbum = createServerFn({ method: "POST" })
  .validator(updateAlbumInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });

    if (!/^[a-zA-Z0-9぀-ゟ゠-ヿ一-鿿-]+$/.test(data.slug)) {
      return { error: "URL に使えない文字が含まれています", success: false } as const;
    }

    const [album] = await db
      .select({ id: albums.id })
      .from(albums)
      .where(and(eq(albums.id, data.id), eq(albums.userId, userId)))
      .limit(1);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    const [duplicate] = await db
      .select({ id: albums.id })
      .from(albums)
      .where(and(eq(albums.slug, data.slug), ne(albums.id, data.id)))
      .limit(1);
    if (duplicate) {
      return { error: "この URL は既に使われています", success: false } as const;
    }

    await db
      .update(albums)
      .set({
        description: data.description,
        slug: data.slug,
        title: data.title,
        updatedAt: new Date(),
        visibility: data.visibility,
      })
      .where(eq(albums.id, data.id));

    return { slug: data.slug, success: true } as const;
  });

export const listMyAlbums = createServerFn({ method: "GET" })
  .validator(z.object({ limit: z.number().int().positive().max(200).optional() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const rows = await db
      .select({
        coverPhotoId: albums.coverPhotoId,
        coverStorageKey: sql<string | null>`(
            SELECT p.storage_key FROM album_photos ap
            JOIN photos p ON p.id = ap.photo_id
            WHERE ap.album_id = ${albums}.id
            ORDER BY ap.sort_order ASC, ap.added_at ASC
            LIMIT 1
          )`.as("cover_storage_key"),
        coverThumbnailKey: sql<string | null>`(
            SELECT p.thumbnail_key FROM album_photos ap
            JOIN photos p ON p.id = ap.photo_id
            WHERE ap.album_id = ${albums}.id
            ORDER BY ap.sort_order ASC, ap.added_at ASC
            LIMIT 1
          )`.as("cover_thumbnail_key"),
        createdAt: albums.createdAt,
        description: albums.description,
        id: albums.id,
        photoCount: sql<number>`(
            SELECT COUNT(*) FROM album_photos WHERE album_photos.album_id = ${albums}.id
          )`.as("photo_count"),
        slug: albums.slug,
        title: albums.title,
        updatedAt: albums.updatedAt,
        visibility: albums.visibility,
      })
      .from(albums)
      .where(eq(albums.userId, userId))
      .orderBy(desc(albums.createdAt))
      .limit(data.limit ?? 200);
    return rows;
  });

export const getAlbumBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const [album] = await db
      .select()
      .from(albums)
      .where(and(eq(albums.slug, data.slug), eq(albums.userId, userId)))
      .limit(1);
    if (!album) {
      throw new Error("NOT_FOUND");
    }

    const photoRows = await db
      .select({
        addedAt: albumPhotos.addedAt,
        alt: photos.alt,
        caption: photos.caption,
        height: photos.height,
        id: photos.id,
        mimeType: photos.mimeType,
        sortOrder: albumPhotos.sortOrder,
        storageKey: photos.storageKey,
        takenAt: photos.takenAt,
        thumbnailKey: photos.thumbnailKey,
        uploadedAt: photos.uploadedAt,
        width: photos.width,
      })
      .from(albumPhotos)
      .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
      .where(eq(albumPhotos.albumId, album.id))
      .orderBy(albumPhotos.sortOrder, albumPhotos.addedAt);

    return { album, photos: photoRows };
  });

const addPhotosInput = z.object({
  albumId: z.string().min(1),
  photoIds: z.array(z.string().min(1)).min(1).max(500),
});

export const addPhotosToAlbum = createServerFn({ method: "POST" })
  .validator(addPhotosInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });

    const [album] = await db
      .select({ id: albums.id })
      .from(albums)
      .where(and(eq(albums.id, data.albumId), eq(albums.userId, userId)))
      .limit(1);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    const ownedPhotos = await db
      .select({ id: photos.id })
      .from(photos)
      .where(and(eq(photos.userId, userId), inArray(photos.id, data.photoIds)));
    if (ownedPhotos.length !== data.photoIds.length) {
      return { error: "追加できない写真が含まれています", success: false } as const;
    }

    const rows = data.photoIds.map((photoId) => ({
      albumId: data.albumId,
      photoId,
    }));
    const inserted = await db
      .insert(albumPhotos)
      .values(rows)
      .onConflictDoNothing()
      .returning({ photoId: albumPhotos.photoId });

    return { inserted: inserted.length, success: true } as const;
  });
