import { createFileRoute } from "@tanstack/react-router";

import { Notice } from "#/components/atoms/Notice";
import { AlbumMasonry } from "#/components/organisms/AlbumMasonry";
import { listPublicAlbums } from "#/server/public.ts";

const IndexPage = () => {
  const { albums } = Route.useLoaderData();
  return (
    <main id="main">
      {albums.length === 0 ? (
        <Notice>公開アルバムはまだありません</Notice>
      ) : (
        <AlbumMasonry albums={albums} />
      )}
    </main>
  );
};

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({ meta: [{ title: "photos.newt239.dev" }] }),
  loader: async () => ({
    albums: await listPublicAlbums(),
  }),
});
