import { createFileRoute } from "@tanstack/react-router";

import { PublicAlbumMasonry } from "#/components/PublicAlbumMasonry";
import { PublicNotice } from "#/components/PublicNotice";
import { listPublicAlbums } from "#/server/public.ts";

const IndexPage = () => {
  const { albums } = Route.useLoaderData();
  if (albums.length === 0) {
    return <PublicNotice>公開アルバムはまだありません</PublicNotice>;
  }
  return <PublicAlbumMasonry albums={albums} />;
};

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({ meta: [{ title: "photos.newt239.dev" }] }),
  loader: async () => ({
    albums: await listPublicAlbums(),
  }),
});
