import { Paper, Stack, Title } from "@mantine/core";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { UploadDropzone } from "#/components/UploadDropzone.tsx";
import { fetchAuth } from "#/server/auth.ts";

const PhotosUploadPage = () => {
  return (
    <Stack p="xl" gap="md" maw={900} mx="auto">
      <Title order={2}>写真をアップロード</Title>
      <Paper withBorder radius="md" p="lg">
        <UploadDropzone />
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/photos/upload")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: PhotosUploadPage,
});
