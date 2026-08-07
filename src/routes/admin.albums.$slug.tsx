import { Badge, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PhotoCard } from "#/components/PhotoCard.tsx";
import { getAlbumBySlug } from "#/server/albums.ts";

const AlbumDetailPage = () => {
  const { album, photos } = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>{album.title ?? "(無題)"}</Title>
            <Group gap="xs">
              <Badge variant="light">{album.visibility === "public" ? "公開" : "非公開"}</Badge>
              <Text size="sm" c="dimmed">
                {photos.length} 枚
              </Text>
            </Group>
          </Stack>
          <Button
            renderRoot={(props) => (
              <Link {...props} to="/admin/albums/$slug/add" params={{ slug }} />
            )}
          >
            写真を追加する
          </Button>
        </Group>
        {album.description && (
          <Text size="sm" c="dimmed">
            {album.description}
          </Text>
        )}
      </Stack>

      {photos.length === 0 ? (
        <Text c="dimmed" size="sm">
          このアルバムにはまだ写真がありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {photos.map((p) => (
            <PhotoCard
              key={p.id}
              albumSlug={slug}
              photo={{
                alt: p.alt,
                caption: p.caption,
                height: p.height,
                id: p.id,
                storageKey: p.storageKey,
                thumbnailKey: p.thumbnailKey,
                width: p.width,
              }}
            />
          ))}
        </SimpleGrid>
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
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | Photo` }],
  }),
  loader: async ({ params }: { params: { slug: string } }): Promise<AlbumDetail> =>
    getAlbumBySlug({ data: { slug: params.slug } }),
});
