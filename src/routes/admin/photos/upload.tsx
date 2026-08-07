import { Paper, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { UploadDropzone } from "#/components/UploadDropzone";

const PhotosUploadPage = () => (
  <Stack p="xl" gap="md">
    <Title order={2}>写真をアップロード</Title>
    <Paper withBorder radius="md" p="lg">
      <UploadDropzone />
    </Paper>
  </Stack>
);

export const Route = createFileRoute("/admin/photos/upload")({
  component: PhotosUploadPage,
  head: () => ({ meta: [{ title: "アップロード | photos.newt239.dev" }] }),
});
