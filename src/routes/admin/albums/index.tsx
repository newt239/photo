import { SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { AlbumCard } from "#/components/molecules/AlbumCard";
import { listMyAlbums } from "#/server/albums.ts";

const AlbumsIndexPage = () => {
  const { albums } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md">
      <Title order={2}>アルバム</Title>
      {albums.length === 0 ? (
        <Text c="dimmed" size="sm">
          アルバムはまだありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};

export const Route = createFileRoute("/admin/albums/")({
  component: AlbumsIndexPage,
  head: () => ({ meta: [{ title: "アルバム | photos.newt239.dev" }] }),
  loader: async () => ({
    albums: await listMyAlbums({ data: {} }),
  }),
});
