import { Text } from "@mantine/core";
import { createFileRoute, notFound } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PublicAlbumGallery } from "#/components/PublicAlbumGallery.tsx";
import { getPublicAlbumBySlug } from "#/server/public.ts";

type PublicAlbum = NonNullable<Awaited<ReturnType<typeof getPublicAlbumBySlug>>>;

const PublicAlbumPage = () => {
  const { album, photos } = Route.useLoaderData();
  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm" p="xl">
        このアルバムにはまだ写真がありません
      </Text>
    );
  }
  return <PublicAlbumGallery title={album.title} description={album.description} photos={photos} />;
};

export const Route = createFileRoute("/albums/$slug")({
  component: PublicAlbumPage,
  head: ({ loaderData }) => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { slug: string } }): Promise<PublicAlbum> => {
    const result = await getPublicAlbumBySlug({ data: { slug: params.slug } });
    if (!result) {
      throw notFound();
    }
    return result;
  },
});
