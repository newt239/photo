import { createFileRoute, notFound } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PhotoDetailView } from "#/components/organisms/PhotoDetailView";
import { getPhoto, getPhotoNeighbors } from "#/server/photos.ts";

const AlbumPhotoDetailPage = () => {
  const { neighbors, photo } = Route.useLoaderData();
  const { slug } = Route.useParams();
  return (
    <PhotoDetailView
      photo={photo}
      albumSlug={slug}
      previousId={neighbors.previousId}
      nextId={neighbors.nextId}
    />
  );
};

export const Route = createFileRoute("/admin/albums_/$slug/photos/$photoId")({
  component: AlbumPhotoDetailPage,
  head: ({ loaderData }) => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
    meta: [{ title: `${loaderData?.photo.caption ?? "写真"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { slug: string; photoId: string } }) => {
    const [photo, neighbors] = await Promise.all([
      getPhoto({ data: { id: params.photoId } }),
      getPhotoNeighbors({ data: { albumSlug: params.slug, id: params.photoId } }),
    ]);
    if (!photo.success || !neighbors.success) {
      throw notFound();
    }
    return {
      neighbors: { nextId: neighbors.nextId, previousId: neighbors.previousId },
      photo: photo.photo,
    };
  },
});
