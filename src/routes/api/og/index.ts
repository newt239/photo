import { createFileRoute } from "@tanstack/react-router";

import { ogImageResponse } from "#/server/og.ts";

export const Route = createFileRoute("/api/og/")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        ogImageResponse(request, {
          coverStorageKey: null,
          description: "撮った写真を並べて置いておく場所",
          title: "photos.newt239.dev",
        }),
    },
  },
});
