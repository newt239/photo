import { ActionIcon, Button } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { PhotoDetailView } from "#/components/PhotoDetailView";
import { getPhoto, getPhotoNeighbors } from "#/server/photos.ts";

type PhotoDetail = {
  photo: Awaited<ReturnType<typeof getPhoto>>;
  neighbors: Awaited<ReturnType<typeof getPhotoNeighbors>>;
};

const AlbumPhotoDetailPage = () => {
  const { neighbors, photo } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { nextId, previousId } = neighbors;
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Button
          variant="subtle"
          size="xs"
          w="fit-content"
          leftSection={<ArrowLeftIcon size={14} />}
          renderRoot={(props) => <Link {...props} to="/admin/albums/$slug" params={{ slug }} />}
        >
          アルバムに戻る
        </Button>
      }
      previousLink={
        previousId ? (
          <ActionIcon
            variant="default"
            aria-label="前の写真"
            renderRoot={(props) => (
              <Link
                {...props}
                to="/admin/albums/$slug/photos/$photoId"
                params={{ photoId: previousId, slug }}
              />
            )}
          >
            <ChevronLeftIcon size={16} />
          </ActionIcon>
        ) : undefined
      }
      nextLink={
        nextId ? (
          <ActionIcon
            variant="default"
            aria-label="次の写真"
            renderRoot={(props) => (
              <Link
                {...props}
                to="/admin/albums/$slug/photos/$photoId"
                params={{ photoId: nextId, slug }}
              />
            )}
          >
            <ChevronRightIcon size={16} />
          </ActionIcon>
        ) : undefined
      }
    />
  );
};

export const Route = createFileRoute("/admin/albums_/$slug/photos/$photoId")({
  component: AlbumPhotoDetailPage,
  head: ({ loaderData }) => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
    meta: [{ title: `${loaderData?.photo.caption ?? "写真"} | photos.newt239.dev` }],
  }),
  loader: async ({
    params,
  }: {
    params: { slug: string; photoId: string };
  }): Promise<PhotoDetail> => {
    const [photo, neighbors] = await Promise.all([
      getPhoto({ data: { id: params.photoId } }),
      getPhotoNeighbors({ data: { albumSlug: params.slug, id: params.photoId } }),
    ]);
    return { neighbors, photo };
  },
});
