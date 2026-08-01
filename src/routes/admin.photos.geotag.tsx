import { Anchor, Paper, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { TimelineGeotagPanel, type GeotagCandidate } from "#/components/TimelineGeotagPanel.tsx";
import { listPhotosMissingLocation } from "#/server/photos.ts";

const PhotosGeotagPage = () => {
  const { photos } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Anchor component={Link} to="/admin/photos" size="sm">
        ← 写真
      </Anchor>
      <Title order={2}>位置情報の一括設定</Title>
      <Text c="dimmed" size="sm">
        Google マップのタイムラインからエクスポートした JSON
        を読み込み、撮影日時が近い記録をもとに位置情報が未設定の写真を補完します。ファイルはブラウザ内で解析され、サーバーには送信されません。
      </Text>
      <Paper withBorder radius="md" p="lg">
        <TimelineGeotagPanel photos={photos} />
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/photos/geotag")({
  component: PhotosGeotagPage,
  head: () => ({ meta: [{ title: "位置情報の一括設定 | Photo" }] }),
  loader: async (): Promise<{ photos: GeotagCandidate[] }> => ({
    photos: await listPhotosMissingLocation({ data: {} }),
  }),
});
