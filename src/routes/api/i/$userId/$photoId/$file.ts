import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";
import { IMAGE_WIDTHS } from "#/lib/upload-constraints.ts";

const FILE_PATTERN = /^original\.(?:jpg|jpeg|png|webp|avif|heic|heif|gif)$/i;

const serveImage = async (key: string, width: number | null, cacheControl: string) => {
  const obj = await env.MY_BUCKET.get(key);
  if (!obj) {
    return new Response("Not Found", { status: 404 });
  }
  const headers = new Headers();
  if (width !== null) {
    try {
      // R2 の body は要素の型を持たないが実体はバイト列なのでそのまま渡す
      // eslint-disable-next-line typescript/no-unsafe-argument
      const result = await env.IMAGES.input(obj.body)
        .transform({ fit: "scale-down", width })
        .output({ format: "image/webp", quality: 82 });
      headers.set("Content-Type", result.contentType());
      headers.set("Cache-Control", cacheControl);
      headers.set("X-Content-Type-Options", "nosniff");
      // 同じ URL でも認証状態により 200 と 404 が変わるため共有キャッシュを分離する
      headers.set("Vary", "Cookie");
      return new Response(result.image(), { headers });
    } catch {
      // 変換できない画像でも表示が途切れないよう原本にフォールバックする
      return serveImage(key, null, cacheControl);
    }
  }
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", cacheControl);
  headers.set("ETag", obj.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Vary", "Cookie");
  return new Response(obj.body, { headers });
};

export const Route = createFileRoute("/api/i/$userId/$photoId/$file")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { userId: ownerId, photoId, file } = params;
        if (!FILE_PATTERN.test(file)) {
          return new Response("Not Found", { status: 404 });
        }
        const url = new URL(request.url);
        const requestedWidth = url.searchParams.get("w");
        if (requestedWidth !== null && !IMAGE_WIDTHS.includes(Number(requestedWidth))) {
          return new Response("Not Found", { status: 404 });
        }
        // アニメーションが失われるため GIF は幅を指定されても原本を返す
        const width =
          requestedWidth === null || file.toLowerCase().endsWith(".gif")
            ? null
            : Number(requestedWidth);
        const key = `users/${ownerId}/photos/${photoId}/${file}`;

        const { userId: requesterId } = await auth();
        if (requesterId === ownerId) {
          return serveImage(key, width, "private, max-age=31536000, immutable");
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

        // 公開経路でしか出し入れしないため非公開の画像がこのキャッシュに載ることはない
        url.search = width === null ? "" : `w=${width}`;
        const cacheKey = url.toString();
        const cache = await caches.open("photo-images");
        const cached = await cache.match(cacheKey);
        // キャッシュから取り出した Response はヘッダーが不変になり後段のミドルウェアが失敗する
        if (cached) {
          return new Response(await cached.arrayBuffer(), {
            headers: new Headers(cached.headers),
          });
        }

        // 公開を取り消した直後もキャッシュから配信され続けないよう短めにする
        const response = await serveImage(key, width, "public, max-age=300, must-revalidate");
        if (response.ok && width !== null) {
          await cache.put(cacheKey, response.clone());
        }
        return response;
      },
    },
  },
});
