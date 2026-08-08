import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albums, photos } from "#/db/schema.ts";
import { ogImageResponse } from "#/server/og.ts";
import { coverPhotoId } from "#/server/public.ts";

export const Route = createFileRoute("/api/og/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = drizzle(env.DB, { schema });
        const rows = await db
          .select({
            storageKey: photos.storageKey,
          })
          .from(albums)
          .innerJoin(photos, eq(photos.id, coverPhotoId))
          .where(eq(albums.visibility, "public"))
          .orderBy(desc(albums.createdAt))
          .limit(8);

        return ogImageResponse(request, {
          coverStorageKeys: rows.map((row) => row.storageKey),
          subheading: null,
          title: "photos.newt239.dev",
        });
      },
    },
  },
});
