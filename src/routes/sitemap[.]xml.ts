import { createFileRoute } from "@tanstack/react-router";
import { env as cloudflareEnv } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { albums } from "#/db/schema.ts";
import { env } from "#/env.ts";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const db = drizzle(cloudflareEnv.DB, { schema });
        const rows = await db
          .select({ slug: albums.slug, updatedAt: albums.updatedAt })
          .from(albums)
          .where(eq(albums.visibility, "public"))
          .orderBy(desc(albums.updatedAt));

        const entries = [
          {
            lastmod: rows[0]?.updatedAt ?? null,
            loc: env.VITE_SITE_URL,
          },
          ...rows.map((row) => ({
            lastmod: row.updatedAt,
            loc: `${env.VITE_SITE_URL}/albums/${encodeURIComponent(row.slug)}`,
          })),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${entry.loc}</loc>${entry.lastmod === null ? "" : `<lastmod>${entry.lastmod.toISOString()}</lastmod>`}</url>`,
  )
  .join("\n")}
</urlset>
`;

        return new Response(body, {
          headers: {
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
    },
  },
});
