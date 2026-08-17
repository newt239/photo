import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albums, photos } from "#/db/schema.ts";
import { getCurrentUserId } from "#/server/user.ts";

// 撮影地の壁時計で集計するため保存済みのオフセットを足す。未設定の写真は JST とみなす
const wallClock = sql`${photos}.taken_at + COALESCE(${photos}.taken_at_offset_minutes, 540) * 60`;

const takenMonth = sql<string>`strftime('%Y-%m', ${wallClock}, 'unixepoch')`;

const takenHour = sql<string>`strftime('%H', ${wallClock}, 'unixepoch')`;

const focalBucket = sql<string>`CASE
    WHEN ${photos}.focal_length < 25 THEN '〜24mm'
    WHEN ${photos}.focal_length < 36 THEN '25-35mm'
    WHEN ${photos}.focal_length < 51 THEN '36-50mm'
    WHEN ${photos}.focal_length < 86 THEN '51-85mm'
    WHEN ${photos}.focal_length < 136 THEN '86-135mm'
    WHEN ${photos}.focal_length < 201 THEN '136-200mm'
    ELSE '201mm〜'
  END`;

const isoBucket = sql<string>`CASE
    WHEN ${photos}.iso <= 200 THEN '〜200'
    WHEN ${photos}.iso <= 400 THEN '201-400'
    WHEN ${photos}.iso <= 800 THEN '401-800'
    WHEN ${photos}.iso <= 1600 THEN '801-1600'
    WHEN ${photos}.iso <= 3200 THEN '1601-3200'
    WHEN ${photos}.iso <= 6400 THEN '3201-6400'
    ELSE '6401〜'
  END`;

const toIso = (seconds: number | null) =>
  seconds === null ? null : new Date(seconds * 1000).toISOString();

export const getPhotoStats = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: "ログインしてください", success: false } as const;
  }
  const db = drizzle(env.DB, { schema });
  const owned = eq(photos.userId, userId);
  const count = sql<number>`count(*)`;

  const hasTakenAt = and(owned, isNotNull(photos.takenAt));

  const summaryQuery = db
    .select({
      earliest: sql<number | null>`min(${photos}.taken_at)`,
      geotagged: sql<number>`COALESCE(SUM(${photos}.latitude IS NOT NULL AND ${photos}.longitude IS NOT NULL), 0)`,
      latest: sql<number | null>`max(${photos}.taken_at)`,
      missingAlt: sql<number>`COALESCE(SUM(${photos}.alt IS NULL OR ${photos}.alt = ''), 0)`,
      missingCaption: sql<number>`COALESCE(SUM(${photos}.caption IS NULL OR ${photos}.caption = ''), 0)`,
      totalBytes: sql<number>`COALESCE(SUM(${photos}.file_size), 0)`,
      totalPhotos: count,
    })
    .from(photos)
    .where(owned);
  const albumQuery = db
    .select({
      publicAlbums: sql<number>`COALESCE(SUM(${albums}.visibility = 'public'), 0)`,
      totalAlbums: count,
    })
    .from(albums)
    .where(eq(albums.userId, userId));
  const unfiledQuery = db
    .select({ count })
    .from(photos)
    .where(
      and(owned, sql`NOT EXISTS (SELECT 1 FROM album_photos ap WHERE ap.photo_id = ${photos}.id)`),
    );
  const cameraQuery = db
    .select({ count, label: photos.cameraModel })
    .from(photos)
    .where(and(owned, isNotNull(photos.cameraModel)))
    .groupBy(photos.cameraModel)
    .orderBy(desc(count))
    .limit(12);
  const lensQuery = db
    .select({ count, label: photos.lensModel })
    .from(photos)
    .where(and(owned, isNotNull(photos.lensModel)))
    .groupBy(photos.lensModel)
    .orderBy(desc(count))
    .limit(12);
  const monthQuery = db
    .select({ count, label: takenMonth })
    .from(photos)
    .where(hasTakenAt)
    .groupBy(takenMonth)
    .orderBy(takenMonth);
  const hourQuery = db
    .select({ count, label: takenHour })
    .from(photos)
    .where(hasTakenAt)
    .groupBy(takenHour)
    .orderBy(takenHour);
  const focalQuery = db
    .select({ count, label: focalBucket })
    .from(photos)
    .where(and(owned, isNotNull(photos.focalLength)))
    .groupBy(focalBucket)
    .orderBy(sql`min(${photos}.focal_length)`);
  const isoQuery = db
    .select({ count, label: isoBucket })
    .from(photos)
    .where(and(owned, isNotNull(photos.iso)))
    .groupBy(isoBucket)
    .orderBy(sql`min(${photos}.iso)`);

  const [summary, albumSummary, unfiled, cameras, lenses, months, hours, focals, isos] =
    await db.batch([
      summaryQuery,
      albumQuery,
      unfiledQuery,
      cameraQuery,
      lensQuery,
      monthQuery,
      hourQuery,
      focalQuery,
      isoQuery,
    ]);

  const [overview] = summary;
  const [albumRow] = albumSummary;

  return {
    cameras: cameras.map((row) => ({ count: row.count, label: row.label ?? "不明" })),
    focalLengths: focals,
    hours: hours.map((row) => ({ count: row.count, label: `${Number(row.label)}時` })),
    isoValues: isos,
    lenses: lenses.map((row) => ({ count: row.count, label: row.label ?? "不明" })),
    months,
    overview: {
      earliest: toIso(overview?.earliest ?? null),
      geotagged: overview?.geotagged ?? 0,
      latest: toIso(overview?.latest ?? null),
      missingAlt: overview?.missingAlt ?? 0,
      missingCaption: overview?.missingCaption ?? 0,
      publicAlbums: albumRow?.publicAlbums ?? 0,
      totalAlbums: albumRow?.totalAlbums ?? 0,
      totalBytes: overview?.totalBytes ?? 0,
      totalPhotos: overview?.totalPhotos ?? 0,
      unfiledPhotos: unfiled[0]?.count ?? 0,
    },
    success: true,
  } as const;
});
