import { Anchor, Button, Group, Stack, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const PhotosIndexPage = () => {
  const { photos } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Anchor component={Link} to="/admin" size="sm">
        ← ホーム
      </Anchor>
      <Group justify="space-between">
        <Title order={2}>写真</Title>
        <Group gap="sm">
          <Button component={Link} to="/admin/photos/geotag" variant="default">
            位置情報を設定する
          </Button>
          <Button component={Link} to="/admin/photos/upload">
            アップロード
          </Button>
        </Group>
      </Group>
      <PhotoGrid photos={photos} />
    </Stack>
  );
};

export const Route = createFileRoute("/admin/photos/")({
  component: PhotosIndexPage,
  head: () => ({ meta: [{ title: "写真 | Photo" }] }),
  loader: async (): Promise<{ photos: PhotoCardData[] }> => ({
    photos: await listMyPhotos({ data: {} }),
  }),
});
