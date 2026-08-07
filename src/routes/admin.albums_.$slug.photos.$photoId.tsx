import { Button } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PhotoDetailView } from "#/components/PhotoDetailView.tsx";
import { getPhoto } from "#/server/photos.ts";

type PhotoDetail = Awaited<ReturnType<typeof getPhoto>>;

const AlbumPhotoDetailPage = () => {
  const photo = Route.useLoaderData();
  const { slug } = Route.useParams();
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Button
          variant="subtle"
          size="xs"
          w="fit-content"
          renderRoot={(props) => <Link {...props} to="/admin/albums/$slug" params={{ slug }} />}
        >
          ← アルバムに戻る
        </Button>
      }
    />
  );
};

export const Route = createFileRoute("/admin/albums_/$slug/photos/$photoId")({
  component: AlbumPhotoDetailPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.caption ?? "写真"} | Photo` }],
  }),
  loader: async ({ params }: { params: { slug: string; photoId: string } }): Promise<PhotoDetail> =>
    getPhoto({ data: { id: params.photoId } }),
});
