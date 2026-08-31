import { createFileRoute } from "@tanstack/react-router";
import { env as cloudflareEnv } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albums, photos } from "#/db/schema.ts";
import { env } from "#/env.ts";
import { formatAlbumPeriod } from "#/lib/format.ts";
import { photoImageUrl, photoSrcSet } from "#/lib/image-url.ts";
import { albumListOrder, coverPhotoId } from "#/server/public.ts";

export const Route = createFileRoute("/api/albums.json")({
  server: {
    handlers: {
      GET: async () => {
        const db = drizzle(cloudflareEnv.DB, { schema }),
         rows = await db
          .select({
            coverStorageKey: photos.storageKey,
            periodEnd: albums.periodEnd,
            periodStart: albums.periodStart,
            slug: albums.slug,
            title: albums.title,
          })
          .from(albums)
          .leftJoin(photos, eq(photos.id, coverPhotoId))
          .where(eq(albums.visibility, "public"))
          .orderBy(...albumListOrder)
          .limit(5),

         body = {
          albums: rows.map((row) => ({
            period: formatAlbumPeriod(row.periodStart, row.periodEnd),
            slug: row.slug,
            thumbnail: row.coverStorageKey
              ? {
                  src: photoImageUrl(row.coverStorageKey, 640),
                  srcset: photoSrcSet(row.coverStorageKey, [640, 1024]) ?? null,
                }
              : null,
            title: row.title,
            url: `${env.VITE_SITE_URL}/albums/${encodeURIComponent(row.slug)}`,
          })),
        };

        return Response.json(body, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "application/json; charset=utf-8",
          },
        });
      },
    },
  },
});
