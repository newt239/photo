import { Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { PublicAlbumMasonry, type PublicAlbumData } from "#/components/PublicAlbumMasonry.tsx";
import { listPublicAlbums } from "#/server/public.ts";

const IndexPage = () => {
  const { albums } = Route.useLoaderData();
  if (albums.length === 0) {
    return (
      <Text c="dimmed" size="sm" p="xl">
        公開アルバムはまだありません
      </Text>
    );
  }
  return <PublicAlbumMasonry albums={albums} />;
};

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({ meta: [{ title: "Photo" }] }),
  loader: async (): Promise<{ albums: PublicAlbumData[] }> => ({
    albums: await listPublicAlbums(),
  }),
});
