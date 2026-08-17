import { createFileRoute, notFound } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PhotoDetailView } from "#/components/organisms/PhotoDetailView";
import { getPhoto } from "#/server/photos.ts";

const PhotoDetailPage = () => {
  const { nextId, photo, previousId } = Route.useLoaderData();
  return <PhotoDetailView key={photo.id} photo={photo} previousId={previousId} nextId={nextId} />;
};

export const Route = createFileRoute("/admin/photos/$photoId")({
  component: PhotoDetailPage,
  head: ({ loaderData }) => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
    meta: [{ title: `${loaderData?.photo.caption ?? "写真"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { photoId: string } }) => {
    const result = await getPhoto({ data: { id: params.photoId } });
    if (!result.success) {
      throw notFound();
    }
    return result;
  },
});
