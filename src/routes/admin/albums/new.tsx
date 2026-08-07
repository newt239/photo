import { useState } from "react";

import { Button, Group, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { VisibilitySegmentedControl } from "#/components/VisibilitySegmentedControl";
import { createAlbum } from "#/server/albums.ts";

const NewAlbumPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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
      const result = await createAlbum({
        data: {
          description: description.trim() || null,
          slug: slug.trim() || null,
          title: title.trim(),
          visibility,
        },
      });
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      await router.navigate({ params: { slug: result.slug }, to: "/admin/albums/$slug" });
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
          <TextInput
            label="URL"
            description="公開ページのアドレスに使われます。英数字・ひらがな・カタカナ・漢字とハイフンが使えます。空欄の場合は名前から自動で作られます"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
            maxLength={200}
          />
          <VisibilitySegmentedControl value={visibility} onChange={setVisibility} />
          {errorMessage && (
            <Text size="sm" c="red">
              {errorMessage}
            </Text>
          )}
          <Group justify="flex-end">
            <Button
              type="submit"
              leftSection={<PlusIcon size={16} />}
              loading={submitting}
              disabled={title.trim().length === 0}
            >
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
