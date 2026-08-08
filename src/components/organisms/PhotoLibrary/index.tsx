import { useState } from "react";

import { Group, Text } from "@mantine/core";
import { useRouter } from "@tanstack/react-router";

import { PhotoViewControls } from "#/components/molecules/PhotoViewControls";
import { PhotoBulkActions } from "#/components/organisms/PhotoBulkActions";
import { PhotoMasonry } from "#/components/organisms/PhotoMasonry";
import { PhotoTable } from "#/components/organisms/PhotoTable";
import { addPhotosToAlbum, createAlbum, removePhotosFromAlbum } from "#/server/albums.ts";
import { deletePhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/molecules/PhotoCard";

type PhotoLibraryProps = {
  photos: PhotoCardData[];
  albums: { id: string; title: string | null }[];
  order: "asc" | "desc";
  view: "masonry" | "table";
  onOrderChange: (next: "asc" | "desc") => void;
  onViewChange: (next: "masonry" | "table") => void;
  album?: { id: string; slug: string };
  emptyMessage?: string;
};

export const PhotoLibrary = ({
  photos,
  albums,
  order,
  view,
  onOrderChange,
  onViewChange,
  album,
  emptyMessage,
}: PhotoLibraryProps) => {
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

  const handleRemove = async () => {
    if (!album || selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await removePhotosFromAlbum({
        data: { albumId: album.id, photoIds: [...selected] },
      });
      if (result.success) {
        setSelected(new Set());
        setNotice(`${result.removed} 枚をアルバムから外しました`);
        await router.invalidate();
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
        setNotice(
          album
            ? `${result.inserted} 枚を別のアルバムに追加しました`
            : `${result.inserted} 枚をアルバムに追加しました`,
        );
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
      const created = await createAlbum({ data: { title } });
      if (!created.success) {
        setError(created.error);
        return;
      }
      const result = await addPhotosToAlbum({
        data: { albumId: created.id, photoIds: [...selected] },
      });
      if (result.success) {
        setSelected(new Set());
        await router.navigate({ params: { slug: created.slug }, to: "/admin/albums/$slug" });
        await router.invalidate();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <PhotoViewControls
          order={order}
          view={view}
          onOrderChange={onOrderChange}
          onViewChange={onViewChange}
        />
        {selected.size > 0 && (
          <PhotoBulkActions
            selectedCount={selected.size}
            submitting={submitting}
            albums={album ? albums.filter((a) => a.id !== album.id) : albums}
            onSelectAll={() => setSelected(new Set(photos.map((p) => p.id)))}
            onCancel={() => {
              setSelected(new Set());
              setError(null);
            }}
            onDelete={handleDelete}
            onAddToAlbum={handleAddToAlbum}
            onCreateAlbum={handleCreateAlbum}
            onRemoveFromAlbum={album ? handleRemove : undefined}
          />
        )}
      </Group>

      {error && (
        <Text size="sm" c="red" role="alert">
          {error}
        </Text>
      )}
      {notice && (
        <Text size="sm" c="dimmed" role="status">
          {notice}
        </Text>
      )}

      {view === "table" ? (
        <PhotoTable
          photos={photos}
          albumSlug={album?.slug}
          emptyMessage={emptyMessage}
          selectedPhotoIds={selected}
          onSelect={toggle}
        />
      ) : (
        <PhotoMasonry
          photos={photos}
          albumSlug={album?.slug}
          emptyMessage={emptyMessage}
          selectedPhotoIds={selected}
          onSelect={toggle}
        />
      )}
    </>
  );
};
