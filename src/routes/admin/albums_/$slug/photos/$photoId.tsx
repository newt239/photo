import { createFileRoute, notFound } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PhotoDetailView } from "#/components/organisms/PhotoDetailView";
import { getPhoto } from "#/server/photos.ts";

const AlbumPhotoDetailPage = () => {
  const { nextId, photo, previousId } = Route.useLoaderData();
  const { slug } = Route.useParams();
  return (
    <PhotoDetailView
      key={photo.id}
      photo={photo}
      albumSlug={slug}
      previousId={previousId}
      nextId={nextId}
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
    const result = await getPhoto({ data: { albumSlug: params.slug, id: params.photoId } });
    if (!result.success) {
      throw notFound();
    }
    return result;
  },
});
