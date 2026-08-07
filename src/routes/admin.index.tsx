import { Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const AdminIndexPage = () => {
  const { photos } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md">
      <Title order={2}>写真</Title>
      <PhotoGrid photos={photos} />
    </Stack>
  );
};

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  head: () => ({ meta: [{ title: "写真 | photos.newt239.dev" }] }),
  loader: async (): Promise<{ photos: PhotoCardData[] }> => ({
    photos: await listMyPhotos({ data: {} }),
  }),
});
