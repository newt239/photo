import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import * as schema from "#/db/schema.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";

export const listPublicAlbums = createServerFn({ method: "GET" }).handler(async () => {
  const db = drizzle(env.DB, { schema });
  const rows = await db
    .select({
      coverHeight: sql<number | null>`(
          SELECT p.height FROM album_photos ap
          JOIN photos p ON p.id = ap.photo_id
          WHERE ap.album_id = ${albums}.id
          ORDER BY ap.sort_order ASC, ap.added_at ASC
          LIMIT 1
        )`.as("cover_height"),
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
      coverWidth: sql<number | null>`(
          SELECT p.width FROM album_photos ap
          JOIN photos p ON p.id = ap.photo_id
          WHERE ap.album_id = ${albums}.id
          ORDER BY ap.sort_order ASC, ap.added_at ASC
          LIMIT 1
        )`.as("cover_width"),
      createdAt: albums.createdAt,
      description: albums.description,
      id: albums.id,
      photoCount: sql<number>`(
          SELECT COUNT(*) FROM album_photos WHERE album_photos.album_id = ${albums}.id
        )`.as("photo_count"),
      slug: albums.slug,
      title: albums.title,
    })
    .from(albums)
    .where(eq(albums.visibility, "public"))
    .orderBy(desc(albums.createdAt));
  return rows;
});

export const getPublicAlbumBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = drizzle(env.DB, { schema });
    const [album] = await db
      .select({
        description: albums.description,
        id: albums.id,
        slug: albums.slug,
        title: albums.title,
      })
      .from(albums)
      .where(and(eq(albums.slug, data.slug), eq(albums.visibility, "public")))
      .limit(1);
    if (!album) {
      return null;
    }

    const photoRows = await db
      .select({
        alt: photos.alt,
        caption: photos.caption,
        height: photos.height,
        id: photos.id,
        latitude: photos.latitude,
        longitude: photos.longitude,
        storageKey: photos.storageKey,
        thumbnailKey: photos.thumbnailKey,
        width: photos.width,
      })
      .from(albumPhotos)
      .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
      .where(eq(albumPhotos.albumId, album.id))
      .orderBy(sql`${photos}.taken_at IS NULL`, asc(photos.takenAt), asc(albumPhotos.addedAt));

    return { album, photos: photoRows };
  });
