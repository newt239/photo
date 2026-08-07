import { useState } from "react";

import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { GlobeIcon, LockIcon } from "lucide-react";

import { PhotoBulkActions } from "#/components/PhotoBulkActions.tsx";
import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { getAlbumBySlug, removePhotosFromAlbum } from "#/server/albums.ts";
import { deletePhotos } from "#/server/photos.ts";

const AlbumDetailPage = () => {
  const { album, photos } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set<string>());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishSelection = async () => {
    setSelected(new Set());
    setSelecting(false);
    await router.invalidate();
  };

  const handleRemove = async () => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await removePhotosFromAlbum({
        data: { albumId: album.id, photoIds: [...selected] },
      });
      if (result.success) {
        await finishSelection();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await deletePhotos({ data: { ids: [...selected] } });
      if (result.success) {
        await finishSelection();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md">
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" wrap="nowrap">
            <Title order={2}>{album.title ?? "(無題)"}</Title>
            {album.visibility === "public" ? (
              <GlobeIcon size={18} aria-label="公開" color="var(--mantine-color-dimmed)" />
            ) : (
              <LockIcon size={18} aria-label="非公開" color="var(--mantine-color-dimmed)" />
            )}
          </Group>
          {selecting ? (
            <PhotoBulkActions
              selectedCount={selected.size}
              submitting={submitting}
              onSelectAll={() => setSelected(new Set(photos.map((p) => p.id)))}
              onCancel={() => {
                setSelecting(false);
                setSelected(new Set());
                setError(null);
              }}
              onDelete={handleDelete}
              onRemoveFromAlbum={handleRemove}
            />
          ) : (
            <Group gap="sm" wrap="nowrap">
              <Button
                variant="default"
                onClick={() => setSelecting(true)}
                disabled={photos.length === 0}
              >
                選択する
              </Button>
              <Button
                variant="default"
                renderRoot={(props) => (
                  <Link {...props} to="/admin/albums/$slug/settings" params={{ slug }} />
                )}
              >
                設定する
              </Button>
              <Button
                renderRoot={(props) => (
                  <Link {...props} to="/admin/albums/$slug/add" params={{ slug }} />
                )}
              >
                写真を追加する
              </Button>
            </Group>
          )}
        </Group>
        {album.description && (
          <Text size="sm" c="dimmed">
            {album.description}
          </Text>
        )}
      </Stack>

      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}

      <PhotoGrid
        photos={photos}
        albumSlug={slug}
        emptyMessage="このアルバムにはまだ写真がありません"
        selectedPhotoIds={selected}
        onSelect={
          selecting
            ? (photoId) =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(photoId)) {
                    next.delete(photoId);
                  } else {
                    next.add(photoId);
                  }
                  return next;
                })
            : undefined
        }
      />
    </Stack>
  );
};

type AlbumDetail = {
  album: {
    id: string;
    title: string | null;
    description: string | null;
    visibility: "public" | "private";
  };
  photos: {
    id: string;
    caption: string | null;
    alt: string | null;
    storageKey: string;
    thumbnailKey: string | null;
    width: number;
    height: number;
  }[];
};

export const Route = createFileRoute("/admin/albums/$slug")({
  component: AlbumDetailPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { slug: string } }): Promise<AlbumDetail> =>
    getAlbumBySlug({ data: { slug: params.slug } }),
});
