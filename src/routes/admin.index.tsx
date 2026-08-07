import { useState } from "react";

import { Group, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { PhotoBulkActions } from "#/components/PhotoBulkActions.tsx";
import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { PhotoTable } from "#/components/PhotoTable.tsx";
import { PhotoViewControls } from "#/components/PhotoViewControls.tsx";
import { addPhotosToAlbum, createAlbum } from "#/server/albums.ts";
import { deletePhotos, listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const AdminIndexPage = () => {
  const { photos } = Route.useLoaderData();
  const { albums } = useLoaderData({ from: "/admin" });
  const { order, view } = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [selected, setSelected] = useState(new Set<string>());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = (photoId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await deletePhotos({ data: { ids: [...selected] } });
      if (result.success) {
        setSelected(new Set());
        setNotice(`${result.deleted} 枚を削除しました`);
        await router.invalidate();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToAlbum = async (albumId: string) => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await addPhotosToAlbum({ data: { albumId, photoIds: [...selected] } });
      if (result.success) {
        setSelected(new Set());
        setNotice(`${result.inserted} 枚をアルバムに追加しました`);
        await router.invalidate();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAlbum = async (title: string) => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const album = await createAlbum({ data: { title } });
      if (!album.success) {
        setError(album.error);
        return;
      }
      const result = await addPhotosToAlbum({
        data: { albumId: album.id, photoIds: [...selected] },
      });
      if (result.success) {
        setSelected(new Set());
        await router.navigate({ params: { slug: album.slug }, to: "/admin/albums/$slug" });
        await router.invalidate();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md">
      <Title order={2}>写真</Title>

      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <PhotoViewControls
          order={order}
          view={view}
          onOrderChange={(next) => {
            void navigate({ replace: true, search: (prev) => ({ ...prev, order: next }) });
          }}
          onViewChange={(next) => {
            void navigate({ replace: true, search: (prev) => ({ ...prev, view: next }) });
          }}
        />
        {selected.size > 0 && (
          <PhotoBulkActions
            selectedCount={selected.size}
            submitting={submitting}
            albums={albums}
            onSelectAll={() => setSelected(new Set(photos.map((p) => p.id)))}
            onCancel={() => {
              setSelected(new Set());
              setError(null);
            }}
            onDelete={handleDelete}
            onAddToAlbum={handleAddToAlbum}
            onCreateAlbum={handleCreateAlbum}
          />
        )}
      </Group>

      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}
      {notice && (
        <Text size="sm" c="dimmed">
          {notice}
        </Text>
      )}

      {view === "table" ? (
        <PhotoTable photos={photos} selectedPhotoIds={selected} onSelect={toggle} />
      ) : (
        <PhotoGrid photos={photos} selectedPhotoIds={selected} onSelect={toggle} />
      )}
    </Stack>
  );
};

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  head: () => ({ meta: [{ title: "写真 | photos.newt239.dev" }] }),
  loader: async ({
    deps,
  }: {
    deps: { order: "asc" | "desc" };
  }): Promise<{ photos: PhotoCardData[] }> => ({
    photos: await listMyPhotos({ data: { order: deps.order } }),
  }),
  loaderDeps: ({ search }) => ({ order: search.order }),
  validateSearch: z.object({
    order: z.enum(["asc", "desc"]).default("desc"),
    view: z.enum(["masonry", "table"]).default("masonry"),
  }),
});
