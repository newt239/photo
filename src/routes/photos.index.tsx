import { Anchor, Button, Group, Stack, Title } from "@mantine/core";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { fetchAuth } from "#/server/auth.ts";
import { listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const PhotosIndexPage = () => {
  const { photos } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Anchor component={Link} to="/" size="sm">
        ← ホーム
      </Anchor>
      <Group justify="space-between">
        <Title order={2}>写真</Title>
        <Button component={Link} to="/photos/upload">
          アップロード
        </Button>
      </Group>
      <PhotoGrid photos={photos} />
    </Stack>
  );
};

export const Route = createFileRoute("/photos/")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: PhotosIndexPage,
  head: () => ({ meta: [{ title: "写真 | Photo" }] }),
  loader: async (): Promise<{ photos: readonly PhotoCardData[] }> => ({
    photos: await listMyPhotos({ data: {} }),
  }),
});
