import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import * as schema from "#/db/schema.ts";
import { photos } from "#/db/schema.ts";

const listMyPhotosInput = z.object({
  album: z.string().optional(),
  camera: z.string().optional(),
  geo: z.enum(["with", "without"]).optional(),
  limit: z.number().int().positive().max(200).default(60),
  missing: z.enum(["caption", "alt"]).optional(),
  month: z
    .string()
    .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/)
    .optional(),
  offset: z.number().int().min(0).default(0),
  order: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().max(100).optional(),
});

export const listMyPhotos = createServerFn({ method: "GET" })
  .validator(listMyPhotosInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "ログインしてください", success: false } as const;
    }
    const db = drizzle(env.DB, { schema });

    const conditions: SQL[] = [eq(photos.userId, userId)];
    if (data.q) {
      const pattern = `%${data.q.replaceAll(/[%_\\]/g, String.raw`\$&`)}%`;
      conditions.push(
        sql`(${photos}.caption LIKE ${pattern} ESCAPE '\' OR ${photos}.alt LIKE ${pattern} ESCAPE '\')`,
      );
    }
    if (data.month) {
      // 撮影地の壁時計で判定するため保存済みのオフセットを足す。未設定の写真は JST とみなす
      conditions.push(
        sql`strftime('%Y-%m', ${photos}.taken_at + COALESCE(${photos}.taken_at_offset_minutes, 540) * 60, 'unixepoch') = ${data.month}`,
      );
    }
    if (data.geo === "with") {
      conditions.push(and(isNotNull(photos.latitude), isNotNull(photos.longitude)) ?? sql`1`);
    }
    if (data.geo === "without") {
      conditions.push(or(isNull(photos.latitude), isNull(photos.longitude)) ?? sql`1`);
    }
    if (data.camera) {
      conditions.push(eq(photos.cameraModel, data.camera));
    }
    if (data.missing) {
      const column = data.missing === "caption" ? photos.caption : photos.alt;
      conditions.push(or(isNull(column), eq(column, "")) ?? sql`1`);
    }
    if (data.album === "none") {
      conditions.push(
        sql`NOT EXISTS (SELECT 1 FROM album_photos ap WHERE ap.photo_id = ${photos}.id)`,
      );
    } else if (data.album) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM album_photos ap WHERE ap.photo_id = ${photos}.id AND ap.album_id = ${data.album})`,
      );
    }
    const where = and(...conditions);

    const direction = data.order === "asc" ? asc : desc;
    const [rows, counted] = await db.batch([
      db
        .select({
          alt: photos.alt,
          caption: photos.caption,
          height: photos.height,
          id: photos.id,
          latitude: photos.latitude,
          longitude: photos.longitude,
          storageKey: photos.storageKey,
          takenAt: photos.takenAt,
          width: photos.width,
        })
        .from(photos)
        .where(where)
        .orderBy(
          sql`${photos}.taken_at IS NULL`,
          direction(photos.takenAt),
          direction(photos.uploadedAt),
        )
        .limit(data.limit)
        .offset(data.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(photos)
        .where(where),
    ]);

    return {
      photos: rows.map((row) => ({
        alt: row.alt,
        caption: row.caption,
        hasLocation: row.latitude !== null && row.longitude !== null,
        height: row.height,
        id: row.id,
        storageKey: row.storageKey,
        takenAt: row.takenAt?.toISOString() ?? null,
        width: row.width,
      })),
      success: true,
      total: counted[0]?.count ?? 0,
    } as const;
  });

export const listCameraModels = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  if (!userId) {
    return [];
  }
  const db = drizzle(env.DB, { schema });
  const rows = await db
    .selectDistinct({ cameraModel: photos.cameraModel })
    .from(photos)
    .where(and(eq(photos.userId, userId), isNotNull(photos.cameraModel)))
    .orderBy(asc(photos.cameraModel));
  return rows.flatMap((row) => (row.cameraModel === null ? [] : [row.cameraModel]));
});
