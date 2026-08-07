import { Button } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PhotoDetailView } from "#/components/PhotoDetailView.tsx";
import { getPhoto } from "#/server/photos.ts";

type PhotoDetail = Awaited<ReturnType<typeof getPhoto>>;

const PhotoDetailPage = () => {
  const photo = Route.useLoaderData();
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Button component={Link} to="/admin" variant="subtle" size="xs" w="fit-content">
          ← 写真一覧に戻る
        </Button>
      }
    />
  );
};

export const Route = createFileRoute("/admin/photos/$photoId")({
  component: PhotoDetailPage,
  head: ({ loaderData }) => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
    meta: [{ title: `${loaderData?.caption ?? "写真"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { photoId: string } }): Promise<PhotoDetail> =>
    getPhoto({ data: { id: params.photoId } }),
});
