import { createFileRoute, useLoaderData, useSearch } from "@tanstack/react-router";

import { PublicAlbumGallery } from "#/components/PublicAlbumGallery.tsx";
import { PublicNotice } from "#/components/PublicNotice.tsx";

const PublicAlbumIndexPage = () => {
  const { photos } = useLoaderData({ from: "/albums/$slug" });
  const { size } = useSearch({ from: "/albums/$slug" });

  if (photos.length === 0) {
    return <PublicNotice>このアルバムにはまだ写真がありません</PublicNotice>;
  }
  return <PublicAlbumGallery photos={photos} size={size} />;
};

export const Route = createFileRoute("/albums/$slug/")({
  component: PublicAlbumIndexPage,
});
