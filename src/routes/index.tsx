import { Button, Card, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AlbumCard, type AlbumCardData } from "#/components/AlbumCard.tsx";
import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { listMyAlbums } from "#/server/albums.ts";
import { fetchAuth } from "#/server/auth.ts";
import { listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const PREVIEW_LIMIT = 6;

type LoaderData =
  | { readonly authed: false }
  | {
      readonly authed: true;
      readonly photos: readonly PhotoCardData[];
      readonly albums: readonly AlbumCardData[];
    };

const SignedOutView = () => (
  <Stack
    mih="calc(100vh - var(--mantine-spacing-xl) * 2)"
    justify="center"
    align="center"
    p="xl"
    gap="lg"
  >
    <Stack gap="xs" align="center">
      <Title order={1}>Photo</Title>
      <Text c="dimmed">あなたの写真を、あなたのために。</Text>
    </Stack>
    <Group>
      <Button component="a" href="/login">
        ログイン
      </Button>
      <Button component="a" href="/register" variant="default">
        新規登録
      </Button>
    </Group>
  </Stack>
);

const ActionCard = ({
  to,
  title,
  description,
}: {
  readonly to: "/photos/upload" | "/albums/new" | "/settings";
  readonly title: string;
  readonly description: string;
}) => (
  <Card component={Link} to={to} withBorder radius="md" padding="md" style={{ height: "100%" }}>
    <Text fw={600} mb={4}>
      {title}
    </Text>
    <Text size="sm" c="dimmed">
      {description}
    </Text>
  </Card>
);

const SignedInView = ({
  photos,
  albums,
}: {
  readonly photos: readonly PhotoCardData[];
  readonly albums: readonly AlbumCardData[];
}) => (
  <Stack p="xl" gap="xl" maw={1200} mx="auto">
    <Stack gap={4}>
      <Title order={1}>Photo</Title>
      <Text c="dimmed" size="sm">
        最近の写真とアルバム
      </Text>
    </Stack>

    <Stack gap="sm">
      <Group justify="space-between" align="baseline">
        <Title order={3}>写真</Title>
        <Text component={Link} to="/photos" size="sm" c="blue">
          すべて見る →
        </Text>
      </Group>
      <PhotoGrid photos={photos} />
    </Stack>

    <Stack gap="sm">
      <Group justify="space-between" align="baseline">
        <Title order={3}>アルバム</Title>
        <Text component={Link} to="/albums" size="sm" c="blue">
          すべて見る →
        </Text>
      </Group>
      {albums.length === 0 ? (
        <Text c="dimmed" size="sm">
          アルバムはまだありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SimpleGrid>
      )}
    </Stack>

    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <ActionCard to="/photos/upload" title="アップロード" description="新しい写真を追加" />
        <ActionCard to="/albums/new" title="アルバム作成" description="写真をまとめる" />
        <ActionCard to="/settings" title="設定" description="プロフィールとテーマ" />
      </SimpleGrid>
    </Paper>
  </Stack>
);

const IndexPage = () => {
  const data = Route.useLoaderData();
  if (!data.authed) {
    return <SignedOutView />;
  }
  return <SignedInView photos={data.photos} albums={data.albums} />;
};

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({ meta: [{ title: "Photo" }] }),
  loader: async (): Promise<LoaderData> => {
    const { userId } = await fetchAuth();
    if (!userId) {
      return { authed: false };
    }
    const [photos, albums] = await Promise.all([
      listMyPhotos({ data: { limit: PREVIEW_LIMIT } }),
      listMyAlbums({ data: { limit: PREVIEW_LIMIT } }),
    ]);
    return { albums, authed: true, photos };
  },
});
