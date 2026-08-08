import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { z } from "zod";

import * as schema from "#/db/schema.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";
import { deleteOwnedPhotos } from "#/server/photos.ts";
import { ensureUserRow } from "#/server/user.ts";

const SLUG_PATTERN = /^[a-zA-Z0-9぀-ゟ゠-ヿ一-鿿-]+$/;

const ID_CHUNK_SIZE = 90;

const INSERT_CHUNK_SIZE = 45;

const coverPhotoId = sql`(
    SELECT COALESCE(
      ${albums}.cover_photo_id,
      (SELECT ap.photo_id FROM album_photos ap
        WHERE ap.album_id = ${albums}.id
        ORDER BY ap.sort_order ASC, ap.added_at ASC
        LIMIT 1)
    )
  )`;

const findOwnedAlbum = async (
  db: DrizzleD1Database<typeof schema>,
  albumId: string,
  userId: string,
) => {
  const [album] = await db
    .select({ coverPhotoId: albums.coverPhotoId, id: albums.id })
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.userId, userId)))
    .limit(1);
  return album;
};

const createAlbumInput = z.object({
  description: z.string().max(2000).nullable().optional(),
  slug: z.string().max(200).nullable().optional(),
  title: z.string().min(1).max(200),
  visibility: z.enum(["public", "private"]).default("private"),
});

export const createAlbum = createServerFn({ method: "POST" })
  .validator(createAlbumInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    await ensureUserRow(userId);
    const db = drizzle(env.DB, { schema });
    const id = nanoid();
    const requested = data.slug?.trim() ?? "";
    if (requested) {
      if (!SLUG_PATTERN.test(requested)) {
        return { error: "URL に使えない文字が含まれています", success: false } as const;
      }
      const [duplicate] = await db
        .select({ id: albums.id })
        .from(albums)
        .where(eq(albums.slug, requested))
        .limit(1);
      if (duplicate) {
        return { error: "この URL は既に使われています", success: false } as const;
      }
    }
    const normalized = data.title
      .normalize("NFKD")
      .replaceAll(/[\u0300-\u036F]/g, "")
      .toLowerCase()
      .replaceAll(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, "-")
      .replaceAll(/^-+|-+$/g, "");
    const slug = requested || `${normalized || "album"}-${nanoid(6)}`;
    try {
      await db.insert(albums).values({
        description: data.description ?? null,
        id,
        slug,
        title: data.title,
        userId,
        visibility: data.visibility,
      });
    } catch {
      // 重複チェックの後に他のリクエストが割り込むと一意制約に違反しうる
      return { error: "この URL は既に使われています", success: false } as const;
    }
    return { id, slug, success: true } as const;
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
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });

    if (!SLUG_PATTERN.test(data.slug)) {
      return { error: "URL に使えない文字が含まれています", success: false } as const;
    }

    const album = await findOwnedAlbum(db, data.id, userId);
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
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });
    const rows = await db
      .select({
        coverPhotoId: albums.coverPhotoId,
        coverStorageKey: photos.storageKey,
        coverThumbnailKey: photos.thumbnailKey,
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
      .leftJoin(photos, eq(photos.id, coverPhotoId))
      .where(eq(albums.userId, userId))
      .orderBy(desc(albums.createdAt))
      .limit(data.limit ?? 200);
    return { albums: rows, success: true } as const;
  });

const getAlbumBySlugInput = z.object({
  order: z.enum(["asc", "desc"]).default("desc"),
  slug: z.string().min(1),
});

export const getAlbumBySlug = createServerFn({ method: "GET" })
  .validator(getAlbumBySlugInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });
    const [album] = await db
      .select({
        coverPhotoId: albums.coverPhotoId,
        coverStorageKey: photos.storageKey,
        coverThumbnailKey: photos.thumbnailKey,
        description: albums.description,
        id: albums.id,
        slug: albums.slug,
        title: albums.title,
        visibility: albums.visibility,
      })
      .from(albums)
      .leftJoin(photos, eq(photos.id, coverPhotoId))
      .where(and(eq(albums.slug, data.slug), eq(albums.userId, userId)))
      .limit(1);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    const direction = data.order === "asc" ? asc : desc;
    const photoRows = await db
      .select({
        alt: photos.alt,
        caption: photos.caption,
        height: photos.height,
        id: photos.id,
        storageKey: photos.storageKey,
        takenAt: photos.takenAt,
        thumbnailKey: photos.thumbnailKey,
        width: photos.width,
      })
      .from(albumPhotos)
      .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
      .where(eq(albumPhotos.albumId, album.id))
      .orderBy(
        sql`${photos}.taken_at IS NULL`,
        direction(photos.takenAt),
        direction(albumPhotos.addedAt),
      );

    return {
      album,
      photos: photoRows.map((row) => ({
        alt: row.alt,
        caption: row.caption,
        height: row.height,
        id: row.id,
        storageKey: row.storageKey,
        takenAt: row.takenAt?.toISOString() ?? null,
        thumbnailKey: row.thumbnailKey,
        width: row.width,
      })),
      success: true,
    } as const;
  });

const setAlbumCoverInput = z.object({
  albumId: z.string().min(1),
  photoId: z.string().min(1).nullable(),
});

export const setAlbumCover = createServerFn({ method: "POST" })
  .validator(setAlbumCoverInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });

    const album = await findOwnedAlbum(db, data.albumId, userId);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    if (data.photoId) {
      const [member] = await db
        .select({ photoId: albumPhotos.photoId })
        .from(albumPhotos)
        .where(and(eq(albumPhotos.albumId, album.id), eq(albumPhotos.photoId, data.photoId)))
        .limit(1);
      if (!member) {
        return { error: "この写真はアルバムに含まれていません", success: false } as const;
      }
    }

    await db
      .update(albums)
      .set({ coverPhotoId: data.photoId, updatedAt: new Date() })
      .where(eq(albums.id, album.id));

    return { success: true } as const;
  });

const addPhotosInput = z.object({
  albumId: z.string().min(1),
  photoIds: z.array(z.string().min(1)).min(1).max(500),
});

export const addPhotosToAlbum = createServerFn({ method: "POST" })
  .validator(addPhotosInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });

    const album = await findOwnedAlbum(db, data.albumId, userId);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    let ownedCount = 0;
    for (let offset = 0; offset < data.photoIds.length; offset += ID_CHUNK_SIZE) {
      // D1 のバインドパラメータ上限を超えないよう ID を分割して問い合わせる
      const chunk = data.photoIds.slice(offset, offset + ID_CHUNK_SIZE);
      const owned = await db
        .select({ id: photos.id })
        .from(photos)
        .where(and(eq(photos.userId, userId), inArray(photos.id, chunk)));
      ownedCount += owned.length;
    }
    if (ownedCount !== data.photoIds.length) {
      return { error: "追加できない写真が含まれています", success: false } as const;
    }

    let inserted = 0;
    for (let offset = 0; offset < data.photoIds.length; offset += INSERT_CHUNK_SIZE) {
      const rows = data.photoIds
        .slice(offset, offset + INSERT_CHUNK_SIZE)
        .map((photoId) => ({ albumId: data.albumId, photoId }));
      // 1 行あたり 2 パラメータを使うため挿入はさらに小さく分割する
      const result = await db
        .insert(albumPhotos)
        .values(rows)
        .onConflictDoNothing()
        .returning({ photoId: albumPhotos.photoId });
      inserted += result.length;
    }

    await db.update(albums).set({ updatedAt: new Date() }).where(eq(albums.id, album.id));

    return { inserted, success: true } as const;
  });

const removePhotosInput = z.object({
  albumId: z.string().min(1),
  photoIds: z.array(z.string().min(1)).min(1).max(500),
});

export const removePhotosFromAlbum = createServerFn({ method: "POST" })
  .validator(removePhotosInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });

    const album = await findOwnedAlbum(db, data.albumId, userId);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    let removed = 0;
    for (let offset = 0; offset < data.photoIds.length; offset += ID_CHUNK_SIZE) {
      // D1 のバインドパラメータ上限を超えないよう ID を分割して削除する
      const chunk = data.photoIds.slice(offset, offset + ID_CHUNK_SIZE);
      const result = await db
        .delete(albumPhotos)
        .where(and(eq(albumPhotos.albumId, album.id), inArray(albumPhotos.photoId, chunk)))
        .returning({ photoId: albumPhotos.photoId });
      removed += result.length;
    }

    const coverRemoved = album.coverPhotoId !== null && data.photoIds.includes(album.coverPhotoId);
    await db
      .update(albums)
      .set({ coverPhotoId: coverRemoved ? null : album.coverPhotoId, updatedAt: new Date() })
      .where(eq(albums.id, album.id));

    return { removed, success: true } as const;
  });

const deleteAlbumInput = z.object({
  deletePhotos: z.boolean(),
  id: z.string().min(1),
});

export const deleteAlbum = createServerFn({ method: "POST" })
  .validator(deleteAlbumInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });

    const album = await findOwnedAlbum(db, data.id, userId);
    if (!album) {
      return { error: "アルバムが見つかりません", success: false } as const;
    }

    let deletedPhotos = 0;
    if (data.deletePhotos) {
      const photoIds = await db
        .select({ id: albumPhotos.photoId })
        .from(albumPhotos)
        .where(eq(albumPhotos.albumId, album.id));
      deletedPhotos = await deleteOwnedPhotos(
        userId,
        photoIds.map((row) => row.id),
      );
    }

    await db.delete(albumPhotos).where(eq(albumPhotos.albumId, album.id));
    await db.delete(albums).where(and(eq(albums.id, album.id), eq(albums.userId, userId)));

    return { deletedPhotos, success: true } as const;
  });
