import { Stack, Title } from "@mantine/core";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { z } from "zod";

import { PhotoLibrary } from "#/components/PhotoLibrary";
import { listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard";

const AdminIndexPage = () => {
  const { photos } = Route.useLoaderData();
  const { albums } = useLoaderData({ from: "/admin" });
  const { order, view } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Stack p="xl" gap="md">
      <Title order={2}>写真</Title>

      <PhotoLibrary
        photos={photos}
        albums={albums}
        order={order}
        view={view}
        onOrderChange={(next) => {
          void navigate({ replace: true, search: (prev) => ({ ...prev, order: next }) });
        }}
        onViewChange={(next) => {
          void navigate({ replace: true, search: (prev) => ({ ...prev, view: next }) });
        }}
      />
    </Stack>
  );
};

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  head: () => ({ meta: [{ title: "写真 | photos.newt239.dev" }] }),
  loader: async ({
    deps,
  }: {
    deps: { order: "asc" | "desc" };
  }): Promise<{ photos: PhotoCardData[] }> => ({
    photos: await listMyPhotos({ data: { order: deps.order } }),
  }),
  loaderDeps: ({ search }) => ({ order: search.order }),
  validateSearch: z.object({
    order: z.enum(["asc", "desc"]).default("desc"),
    view: z.enum(["masonry", "table"]).default("masonry"),
  }),
});
