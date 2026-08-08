import { ActionIcon, Button, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { Link, createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { ExternalLinkIcon, ImagePlusIcon, SettingsIcon } from "lucide-react";
import { z } from "zod";

import { VisibilityIcon } from "#/components/atoms/VisibilityIcon";
import { PhotoLibrary } from "#/components/organisms/PhotoLibrary";
import { formatAlbumPeriod } from "#/lib/format.ts";
import { getAlbumBySlug } from "#/server/albums.ts";

const AlbumDetailPage = () => {
  const { album, photos } = Route.useLoaderData();
  const { albums } = useLoaderData({ from: "/admin" });
  const { slug } = Route.useParams();
  const { order, view } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Stack p="xl" gap="md">
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" wrap="nowrap">
            <Title order={2}>{album.title ?? "(無題)"}</Title>
            <VisibilityIcon visibility={album.visibility} size={18} />
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
        {formatAlbumPeriod(album.periodStart, album.periodEnd) && (
          <Text size="sm" c="dimmed">
            {formatAlbumPeriod(album.periodStart, album.periodEnd)}
          </Text>
        )}
      </Stack>

      <PhotoLibrary
        photos={photos}
        albums={albums}
        order={order}
        view={view}
        onOrderChange={(next) => {
          navigate({ replace: true, search: (prev) => ({ ...prev, order: next }) });
        }}
        onViewChange={(next) => {
          navigate({ replace: true, search: (prev) => ({ ...prev, view: next }) });
        }}
        album={{ id: album.id, slug }}
        emptyMessage="このアルバムにはまだ写真がありません"
      />
    </Stack>
  );
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
  }) => {
    const result = await getAlbumBySlug({ data: { order: deps.order, slug: params.slug } });
    if (!result.success) {
      throw notFound();
    }
    return { album: result.album, photos: result.photos };
  },
  loaderDeps: ({ search }) => ({ order: search.order }),
  validateSearch: z.object({
    order: z.enum(["asc", "desc"]).default("desc"),
    view: z.enum(["grid", "table"]).default("grid"),
  }),
});
