import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albums, photos } from "#/db/schema.ts";
import { ogImageResponse } from "#/server/og.ts";
import { coverPhotoId } from "#/server/public.ts";

export const Route = createFileRoute("/api/og/albums/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const db = drizzle(env.DB, { schema });
        const [album] = await db
          .select({
            coverStorageKey: photos.thumbnailKey,
            description: albums.description,
            fallbackStorageKey: photos.storageKey,
            title: albums.title,
          })
          .from(albums)
          .leftJoin(photos, eq(photos.id, coverPhotoId))
          .where(and(eq(albums.slug, params.slug), eq(albums.visibility, "public")))
          .limit(1);
        if (!album) {
          return new Response("Not Found", { status: 404 });
        }

        return ogImageResponse(request, {
          coverStorageKey: album.coverStorageKey ?? album.fallbackStorageKey,
          description: album.description,
          title: album.title ?? "アルバム",
        });
      },
    },
  },
});
