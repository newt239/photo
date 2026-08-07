import { useState } from "react";

import { ActionIcon, Button, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { Link, createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { ExternalLinkIcon, GlobeIcon, ImagePlusIcon, LockIcon, SettingsIcon } from "lucide-react";
import { z } from "zod";

import { PhotoBulkActions } from "#/components/PhotoBulkActions.tsx";
import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { PhotoTable } from "#/components/PhotoTable.tsx";
import { PhotoViewControls } from "#/components/PhotoViewControls.tsx";
import {
  addPhotosToAlbum,
  createAlbum,
  getAlbumBySlug,
  removePhotosFromAlbum,
} from "#/server/albums.ts";
import { deletePhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const AlbumDetailPage = () => {
  const { album, photos } = Route.useLoaderData();
  const { albums } = useLoaderData({ from: "/admin" });
  const { slug } = Route.useParams();
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

  const handleRemove = async () => {
    if (selected.size === 0 || submitting) {
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
        setNotice(`${result.inserted} 枚を別のアルバムに追加しました`);
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
          <Group gap="sm" wrap="nowrap">
            <Tooltip label="公開ページを開く">
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="公開ページを開く"
                component="a"
                href={`/albums/${encodeURIComponent(slug)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="設定する">
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="設定する"
                renderRoot={(props) => (
                  <Link {...props} to="/admin/albums/$slug/settings" params={{ slug }} />
                )}
              >
                <SettingsIcon size={18} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<ImagePlusIcon size={16} />}
              renderRoot={(props) => (
                <Link {...props} to="/admin/albums/$slug/add" params={{ slug }} />
              )}
            >
              写真を追加する
            </Button>
          </Group>
        </Group>
        {album.description && (
          <Text size="sm" c="dimmed">
            {album.description}
          </Text>
        )}
      </Stack>

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
            albums={albums.filter((a) => a.id !== album.id)}
            onSelectAll={() => setSelected(new Set(photos.map((p) => p.id)))}
            onCancel={() => {
              setSelected(new Set());
              setError(null);
            }}
            onDelete={handleDelete}
            onAddToAlbum={handleAddToAlbum}
            onCreateAlbum={handleCreateAlbum}
            onRemoveFromAlbum={handleRemove}
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
        <PhotoTable
          photos={photos}
          albumSlug={slug}
          emptyMessage="このアルバムにはまだ写真がありません"
          selectedPhotoIds={selected}
          onSelect={toggle}
        />
      ) : (
        <PhotoGrid
          photos={photos}
          albumSlug={slug}
          emptyMessage="このアルバムにはまだ写真がありません"
          selectedPhotoIds={selected}
          onSelect={toggle}
        />
      )}
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
  photos: PhotoCardData[];
};

export const Route = createFileRoute("/admin/albums/$slug")({
  component: AlbumDetailPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | photos.newt239.dev` }],
  }),
  loader: async ({
    deps,
    params,
  }: {
    deps: { order: "asc" | "desc" };
    params: { slug: string };
  }): Promise<AlbumDetail> => getAlbumBySlug({ data: { order: deps.order, slug: params.slug } }),
  loaderDeps: ({ search }) => ({ order: search.order }),
  validateSearch: z.object({
    order: z.enum(["asc", "desc"]).default("desc"),
    view: z.enum(["masonry", "table"]).default("masonry"),
  }),
});
