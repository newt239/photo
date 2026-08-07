import { useState } from "react";

import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { PhotoBulkActions } from "#/components/PhotoBulkActions.tsx";
import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { deletePhotos, listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const AdminIndexPage = () => {
  const { photos } = Route.useLoaderData();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set<string>());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await deletePhotos({ data: { ids: [...selected] } });
      if (result.success) {
        setSelected(new Set());
        setSelecting(false);
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
      <Group justify="space-between" align="center" wrap="wrap">
        <Title order={2}>写真</Title>
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
          />
        ) : (
          <Button
            variant="default"
            onClick={() => setSelecting(true)}
            disabled={photos.length === 0}
          >
            選択する
          </Button>
        )}
      </Group>

      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}

      <PhotoGrid
        photos={photos}
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

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  head: () => ({ meta: [{ title: "写真 | photos.newt239.dev" }] }),
  loader: async (): Promise<{ photos: PhotoCardData[] }> => ({
    photos: await listMyPhotos({ data: {} }),
  }),
});
