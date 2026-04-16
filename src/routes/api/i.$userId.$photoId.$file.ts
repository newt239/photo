import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

const FILE_PATTERN = /^(original|thumb)\.(jpg|jpeg|png|webp|avif|heic|heif|gif)$/i;

export const Route = createFileRoute("/api/i/$userId/$photoId/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { userId: ownerId, photoId, file } = params;
        if (!FILE_PATTERN.test(file)) {
          return new Response("Not Found", { status: 404 });
        }
        const { userId: requesterId } = await auth();
        if (!requesterId || requesterId !== ownerId) {
          return new Response("Not Found", { status: 404 });
        }
        const key = `users/${ownerId}/photos/${photoId}/${file}`;
        const obj = await env.MY_BUCKET.get(key);
        if (!obj) {
          return new Response("Not Found", { status: 404 });
        }
        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set("Cache-Control", "private, max-age=3600");
        headers.set("ETag", obj.httpEtag);
        return new Response(obj.body, { headers });
      },
    },
  },
});
