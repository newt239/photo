import { createFileRoute, notFound } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PhotoDetailView } from "#/components/organisms/PhotoDetailView";
import { getPhoto, getPhotoNeighbors } from "#/server/photos.ts";

const PhotoDetailPage = () => {
  const { neighbors, photo } = Route.useLoaderData();
  return (
    <PhotoDetailView
      key={photo.id}
      photo={photo}
      previousId={neighbors.previousId}
      nextId={neighbors.nextId}
    />
  );
};

export const Route = createFileRoute("/admin/photos/$photoId")({
  component: PhotoDetailPage,
  head: ({ loaderData }) => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
    meta: [{ title: `${loaderData?.photo.caption ?? "写真"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { photoId: string } }) => {
    const [photo, neighbors] = await Promise.all([
      getPhoto({ data: { id: params.photoId } }),
      getPhotoNeighbors({ data: { id: params.photoId } }),
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
