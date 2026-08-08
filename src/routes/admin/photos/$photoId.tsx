import { ActionIcon, Button } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { PhotoDetailView } from "#/components/PhotoDetailView";
import { getPhoto, getPhotoNeighbors } from "#/server/photos.ts";

const PhotoDetailPage = () => {
  const { neighbors, photo } = Route.useLoaderData();
  const { nextId, previousId } = neighbors;
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Button
          component={Link}
          to="/admin"
          variant="subtle"
          size="xs"
          w="fit-content"
          leftSection={<ArrowLeftIcon size={14} />}
        >
          写真一覧に戻る
        </Button>
      }
      previousLink={
        previousId ? (
          <ActionIcon
            variant="default"
            aria-label="前の写真"
            renderRoot={(props) => (
              <Link {...props} to="/admin/photos/$photoId" params={{ photoId: previousId }} />
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
              <Link {...props} to="/admin/photos/$photoId" params={{ photoId: nextId }} />
            )}
          >
            <ChevronRightIcon size={16} />
          </ActionIcon>
        ) : undefined
      }
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
    return { neighbors, photo };
  },
});
