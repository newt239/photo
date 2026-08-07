import { Text } from "@mantine/core";
import { createFileRoute, useLoaderData, useSearch } from "@tanstack/react-router";

import { PublicAlbumGallery } from "#/components/PublicAlbumGallery.tsx";

const PublicAlbumIndexPage = () => {
  const { album, photos } = useLoaderData({ from: "/albums/$slug" });
  const { size } = useSearch({ from: "/albums/$slug" });

  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm" p="xl">
        このアルバムにはまだ写真がありません
      </Text>
    );
  }
  return (
    <PublicAlbumGallery
      title={album.title}
      description={album.description}
      photos={photos}
      size={size}
    />
  );
};

export const Route = createFileRoute("/albums/$slug/")({
  component: PublicAlbumIndexPage,
});
