import { Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";

import { AlbumCard } from "#/components/AlbumCard.tsx";
import { listMyAlbums } from "#/server/albums.ts";
import { fetchAuth } from "#/server/auth.ts";

const AlbumsIndexPage = () => {
  const { albums } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Group justify="space-between">
        <Title order={2}>アルバム</Title>
        <Button component={Link} to="/albums/new">
          新規作成
        </Button>
      </Group>
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

export const Route = createFileRoute("/albums/")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: AlbumsIndexPage,
  loader: async () => {
    const albums = await listMyAlbums();
    return { albums };
  },
});
