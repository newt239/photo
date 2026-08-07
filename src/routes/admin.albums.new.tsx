import { useState } from "react";

import {
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { createAlbum } from "#/server/albums.ts";

const NewAlbumPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { slug } = await createAlbum({
        data: {
          description: description.trim() || null,
          title: title.trim(),
          visibility,
        },
      });
      await router.navigate({ params: { slug }, to: "/admin/albums/$slug" });
      await router.invalidate();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md">
      <Title order={2}>新しいアルバム</Title>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="名前"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            maxLength={200}
          />
          <Textarea
            label="説明"
            autosize
            minRows={2}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            maxLength={2000}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              公開状態
            </Text>
            <SegmentedControl
              value={visibility}
              onChange={(v) => setVisibility(v)}
              data={[
                { label: "非公開", value: "private" },
                { label: "公開", value: "public" },
              ]}
            />
          </div>
          {errorMessage && (
            <Text size="sm" c="red">
              {errorMessage}
            </Text>
          )}
          <Group justify="flex-end">
            <Button type="submit" loading={submitting} disabled={title.trim().length === 0}>
              作成する
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/albums/new")({
  component: NewAlbumPage,
  head: () => ({ meta: [{ title: "新規アルバム | photos.newt239.dev" }] }),
});
