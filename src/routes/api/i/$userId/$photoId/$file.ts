import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";

const FILE_PATTERN = /^(?:original|thumb)\.(?:jpg|jpeg|png|webp|avif|heic|heif|gif)$/i;

const serveFromR2 = async (key: string, cacheControl: string) => {
  const obj = await env.MY_BUCKET.get(key);
  if (!obj) {
    return new Response("Not Found", { status: 404 });
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", cacheControl);
  headers.set("ETag", obj.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  // 同じ URL でも認証状態により 200 と 404 が変わるため共有キャッシュを分離する
  headers.set("Vary", "Cookie");
  return new Response(obj.body, { headers });
};

export const Route = createFileRoute("/api/i/$userId/$photoId/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { userId: ownerId, photoId, file } = params;
        if (!FILE_PATTERN.test(file)) {
          return new Response("Not Found", { status: 404 });
        }
        const key = `users/${ownerId}/photos/${photoId}/${file}`;

        const { userId: requesterId } = await auth();
        if (requesterId === ownerId) {
          return serveFromR2(key, "private, max-age=3600");
        }

        const db = drizzle(env.DB, { schema });
        const [row] = await db
          .select({ one: sql`1` })
          .from(albumPhotos)
          .innerJoin(albums, eq(albumPhotos.albumId, albums.id))
          .innerJoin(photos, eq(photos.id, albumPhotos.photoId))
          .where(
            and(
              eq(albumPhotos.photoId, photoId),
              eq(photos.userId, ownerId),
              eq(albums.visibility, "public"),
            ),
          )
          .limit(1);
        if (!row) {
          return new Response("Not Found", { status: 404 });
        }
        // 公開を取り消した直後もキャッシュから配信され続けないよう短めにする
        return serveFromR2(key, "public, max-age=300, must-revalidate");
      },
    },
  },
});
