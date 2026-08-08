import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { z } from "zod";

import * as schema from "#/db/schema.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "#/lib/upload-constraints.ts";
import { MIME_EXT, signPutUrl } from "#/server/storage.ts";
import { ensureUserRow, requireUserId } from "#/server/user.ts";

const THUMB_MIME = "image/webp";

const createPhotoUploadInput = z.object({
  contentType: z.enum(ALLOWED_MIME_TYPES),
  hasThumbnail: z.boolean().default(true),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export const createPhotoUpload = createServerFn({ method: "POST" })
  .validator(createPhotoUploadInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    await ensureUserRow(userId);
    const photoId = nanoid();
    const extension = MIME_EXT[data.contentType.toLowerCase()] ?? "bin";
    const originalKey = `users/${userId}/photos/${photoId}/original.${extension}`;
    const originalUrl = await signPutUrl(originalKey, data.contentType);
    let thumbnailKey: string | null = null;
    let thumbnailUrl: string | null = null;
    if (data.hasThumbnail) {
      thumbnailKey = `users/${userId}/photos/${photoId}/thumb.webp`;
      thumbnailUrl = await signPutUrl(thumbnailKey, THUMB_MIME);
    }
    return {
      originalKey,
      originalUrl,
      photoId,
      thumbnailKey,
      thumbnailUrl,
    };
  });

const finalizePhotoInput = z.object({
  altitude: z.number().nullable().optional(),
  aperture: z.number().nullable().optional(),
  cameraMake: z.string().nullable().optional(),
  cameraModel: z.string().nullable().optional(),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  focalLength: z.number().nullable().optional(),
  height: z.number().int().positive(),
  iso: z.number().int().nullable().optional(),
  latitude: z.number().nullable().optional(),
  lensModel: z.string().nullable().optional(),
  longitude: z.number().nullable().optional(),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  orientation: z.number().int().nullable().optional(),
  originalKey: z.string().min(1),
  photoId: z.string().min(1),
  rawExif: z.string().nullable().optional(),
  shutterSpeed: z.string().nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
  thumbnailKey: z.string().nullable(),
  width: z.number().int().positive(),
});

export const finalizePhoto = createServerFn({ method: "POST" })
  .validator(finalizePhotoInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const originalOwner = /^users\/(?<ownerId>[^/]+)\//.exec(data.originalKey)?.groups?.ownerId;
    if (originalOwner !== userId) {
      throw new Error("FORBIDDEN");
    }
    const thumbnailOwner = data.thumbnailKey
      ? /^users\/(?<ownerId>[^/]+)\//.exec(data.thumbnailKey)?.groups?.ownerId
      : userId;
    if (thumbnailOwner !== userId) {
      throw new Error("FORBIDDEN");
    }

    const head = await env.MY_BUCKET.head(data.originalKey);
    if (!head) {
      throw new Error("UPLOAD_NOT_FOUND");
    }

    try {
      const db = drizzle(env.DB, { schema });
      await db.insert(photos).values({
        altitude: data.altitude ?? null,
        aperture: data.aperture ?? null,
        cameraMake: data.cameraMake ?? null,
        cameraModel: data.cameraModel ?? null,
        fileSize: data.fileSize,
        focalLength: data.focalLength ?? null,
        height: data.height,
        id: data.photoId,
        iso: data.iso ?? null,
        latitude: data.latitude ?? null,
        lensModel: data.lensModel ?? null,
        longitude: data.longitude ?? null,
        mimeType: data.mimeType,
        orientation: data.orientation ?? null,
        rawExif: data.rawExif ?? null,
        shutterSpeed: data.shutterSpeed ?? null,
        storageKey: data.originalKey,
        takenAt: data.takenAt ? new Date(data.takenAt) : null,
        thumbnailKey: data.thumbnailKey,
        userId,
        visibility: "private",
        width: data.width,
      });
    } catch (error) {
      await env.MY_BUCKET.delete(data.originalKey).catch(() => {});
      if (data.thumbnailKey) {
        await env.MY_BUCKET.delete(data.thumbnailKey).catch(() => {});
      }
      throw error;
    }

    return { id: data.photoId };
  });

const listMyPhotosInput = z.object({
  limit: z.number().int().positive().max(200).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const listMyPhotos = createServerFn({ method: "GET" })
  .validator(listMyPhotosInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const direction = data.order === "asc" ? asc : desc;
    const rows = await db
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
      .from(photos)
      .where(eq(photos.userId, userId))
      .orderBy(
        sql`${photos}.taken_at IS NULL`,
        direction(photos.takenAt),
        direction(photos.uploadedAt),
      )
      .limit(data.limit ?? 200);
    return rows.map((row) => ({
      alt: row.alt,
      caption: row.caption,
      height: row.height,
      id: row.id,
      storageKey: row.storageKey,
      takenAt: row.takenAt?.toISOString() ?? null,
      thumbnailKey: row.thumbnailKey,
      width: row.width,
    }));
  });

export const getPhoto = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const [row] = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!row) {
      throw new Error("NOT_FOUND");
    }
    const albumRows = await db
      .select({
        id: albums.id,
        slug: albums.slug,
        title: albums.title,
        visibility: albums.visibility,
      })
      .from(albumPhotos)
      .innerJoin(albums, eq(albumPhotos.albumId, albums.id))
      .where(and(eq(albumPhotos.photoId, data.id), eq(albums.userId, userId)))
      .orderBy(albums.createdAt);
    return { ...row, albums: albumRows };
  });

const getPhotoNeighborsInput = z.object({
  albumSlug: z.string().min(1).nullable().optional(),
  id: z.string().min(1),
});

export const getPhotoNeighbors = createServerFn({ method: "GET" })
  .validator(getPhotoNeighborsInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const orderBy = [
      sql`${photos}.taken_at IS NULL`,
      desc(photos.takenAt),
      desc(photos.uploadedAt),
    ];
    const rows = data.albumSlug
      ? await db
          .select({ id: photos.id })
          .from(albumPhotos)
          .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
          .innerJoin(albums, eq(albumPhotos.albumId, albums.id))
          .where(and(eq(albums.slug, data.albumSlug), eq(albums.userId, userId)))
          .orderBy(...orderBy)
      : await db
          .select({ id: photos.id })
          .from(photos)
          .where(eq(photos.userId, userId))
          .orderBy(...orderBy);
    const index = rows.findIndex((row) => row.id === data.id);
    if (index === -1) {
      return { nextId: null, previousId: null };
    }
    return {
      nextId: rows[index + 1]?.id ?? null,
      previousId: rows[index - 1]?.id ?? null,
    };
  });

const missingLocation = or(isNull(photos.latitude), isNull(photos.longitude));

export const listPhotosMissingLocation = createServerFn({ method: "GET" })
  .validator(z.object({ limit: z.number().int().positive().max(1000).optional() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const rows = await db
      .select({
        alt: photos.alt,
        caption: photos.caption,
        id: photos.id,
        storageKey: photos.storageKey,
        takenAt: photos.takenAt,
        thumbnailKey: photos.thumbnailKey,
      })
      .from(photos)
      .where(and(eq(photos.userId, userId), missingLocation))
      .orderBy(desc(photos.takenAt))
      .limit(data.limit ?? 1000);
    return rows.map((row) => ({
      alt: row.alt,
      caption: row.caption,
      id: row.id,
      storageKey: row.storageKey,
      takenAt: row.takenAt?.toISOString() ?? null,
      thumbnailKey: row.thumbnailKey,
    }));
  });

const locationItemSchema = z.object({
  id: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const applyPhotoLocationsInput = z.object({
  items: z.array(locationItemSchema).min(1).max(100),
});

export const applyPhotoLocations = createServerFn({ method: "POST" })
  .validator(applyPhotoLocationsInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const [first, ...rest] = data.items.map((item) => {
      const condition = and(eq(photos.id, item.id), eq(photos.userId, userId), missingLocation);
      return db
        .update(photos)
        .set({ latitude: item.latitude, longitude: item.longitude })
        .where(condition)
        .returning({ id: photos.id });
    });
    if (!first) {
      return { error: "EMPTY", success: false } as const;
    }
    const results = await db.batch([first, ...rest]);
    return { success: true, updated: results.flat().length } as const;
  });

const updatePhotoInput = z.object({
  alt: z.string().max(500).nullable(),
  caption: z.string().max(2000).nullable(),
  id: z.string().min(1),
});

export const updatePhoto = createServerFn({ method: "POST" })
  .validator(updatePhotoInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const [existing] = await db
      .select({ id: photos.id })
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!existing) {
      return { error: "NOT_FOUND", success: false } as const;
    }
    await db
      .update(photos)
      .set({ alt: data.alt, caption: data.caption })
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)));
    return { id: data.id, success: true } as const;
  });

const updatePhotoVisibilityInput = z.object({
  id: z.string().min(1),
  visibility: z.enum(["public", "private"]),
});

export const updatePhotoVisibility = createServerFn({ method: "POST" })
  .validator(updatePhotoVisibilityInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const [existing] = await db
      .select({ id: photos.id })
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!existing) {
      return { error: "NOT_FOUND", success: false } as const;
    }
    await db
      .update(photos)
      .set({ visibility: data.visibility })
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)));
    return { success: true, visibility: data.visibility } as const;
  });

export const deleteOwnedPhotos = createServerOnlyFn(async (userId: string, photoIds: string[]) => {
  if (photoIds.length === 0) {
    return 0;
  }
  const db = drizzle(env.DB, { schema });
  const rows = await db
    .select({ id: photos.id, storageKey: photos.storageKey, thumbnailKey: photos.thumbnailKey })
    .from(photos)
    .where(and(eq(photos.userId, userId), inArray(photos.id, photoIds)));
  if (rows.length === 0) {
    return 0;
  }
  const deletableIds = rows.map((row) => row.id);
  const storageKeys = rows.flatMap((row) =>
    row.thumbnailKey ? [row.storageKey, row.thumbnailKey] : [row.storageKey],
  );
  await db.delete(photos).where(and(eq(photos.userId, userId), inArray(photos.id, deletableIds)));
  await env.MY_BUCKET.delete(storageKeys);
  return rows.length;
});

const deletePhotosInput = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export const deletePhotos = createServerFn({ method: "POST" })
  .validator(deletePhotosInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const deleted = await deleteOwnedPhotos(userId, data.ids);
    if (deleted === 0) {
      return { error: "削除できる写真がありません", success: false } as const;
    }
    return { deleted, success: true } as const;
  });

const draftSchema = z
  .object({
    alt: z.string(),
    caption: z.string(),
  })
  .partial();

const generatePhotoDraftInput = z.object({
  fields: z
    .array(z.enum(["caption", "alt"]))
    .min(1)
    .default(["caption", "alt"]),
  id: z.string().min(1),
});

const captionInstruction =
  "caption は写真に写っているものを一言で表す30文字以内の短い説明にしてください。1文だけとし、句点は付けず、宣伝的な言い回しや主観的な評価は使わないでください。";

const altInstruction =
  "alt はスクリーンリーダー利用者が視覚情報なしで内容を理解できる代替テキストです。次のルールに従ってください。" +
  "1文目は必ず「◯◯の写真」「◯◯のスクリーンショット」「◯◯の画像」のいずれかで始める。実写なら写真、PCやスマホの画面キャプチャならスクリーンショット、イラストや図解やCGなど上記以外なら画像とする。" +
  "続けて3〜5文程度で、構図や主要な要素を平易な日本語で説明的に描写する。専門用語や難しい言い回しは避ける。" +
  "投稿者が伝えたいであろう主題に関係する情報だけを書き、写っているものを網羅的に列挙しない。" +
  "「美しい」「素晴らしい」などの主観的評価や、「◯◯のように見えます」などの曖昧な推測表現は避ける。" +
  "人物は中立的に「人物」と表現し、性別や年齢などの属性は主題に明確に関係する場合のみ言及する。" +
  "スクリーンショットや文字が主要な情報となる画像では、説明の後に改行を入れて画像内のテキストを読みやすく書き起こす。ただしOSのステータスバーやブラウザのUIなど主題に関係しないUI要素は書き起こさない。";

export const generatePhotoDraft = createServerFn({ method: "POST" })
  .validator(generatePhotoDraftInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = drizzle(env.DB, { schema });
    const [photo] = await db
      .select({ storageKey: photos.storageKey, thumbnailKey: photos.thumbnailKey })
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!photo) {
      return { error: "NOT_FOUND", success: false } as const;
    }

    const obj = await env.MY_BUCKET.get(photo.thumbnailKey ?? photo.storageKey);
    if (!obj) {
      return { error: "IMAGE_NOT_FOUND", success: false } as const;
    }
    const bytes = new Uint8Array(await obj.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCodePoint(...bytes.subarray(i, i + 8192));
    }
    const dataUri = `data:${obj.httpMetadata?.contentType ?? "image/jpeg"};base64,${btoa(binary)}`;

    const wantsCaption = data.fields.includes("caption");
    const wantsAlt = data.fields.includes("alt");
    const jsonShape = data.fields.map((field) => `"${field}": "..."`).join(", ");
    const instruction = `あなたは写真管理アプリのアシスタントです。画像を見て日本語で ${data.fields.join(" と ")} を生成します。出力は必ず次のJSON形式のみとし、前後に文章を付けないでください: {${jsonShape}}。${wantsCaption ? captionInstruction : ""}${wantsAlt ? altInstruction : ""}`;

    const result = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
      max_tokens: 512,
      messages: [
        {
          content: [
            { text: instruction, type: "text" },
            { image_url: { url: dataUri }, type: "image_url" },
          ],
          role: "user",
        },
      ],
      temperature: 0.2,
    });

    const { response } = result;
    const parsed = draftSchema.safeParse(response);
    let caption = "";
    let alt = "";
    if (parsed.success) {
      const { alt: parsedAlt, caption: parsedCaption } = parsed.data;
      caption = parsedCaption ?? "";
      alt = parsedAlt ?? "";
    } else if (typeof response === "string") {
      if (wantsCaption) {
        caption = response.trim();
      } else {
        alt = response.trim();
      }
    }

    return {
      alt: wantsAlt ? alt : null,
      caption: wantsCaption ? caption : null,
      success: true,
    } as const;
  });
