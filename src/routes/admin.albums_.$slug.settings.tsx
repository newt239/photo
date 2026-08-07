import { useState } from "react";

import {
  ActionIcon,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { getAlbumBySlug, updateAlbum } from "#/server/albums.ts";

const AlbumSettingsPage = () => {
  const { album } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const router = useRouter();
  const [title, setTitle] = useState(album.title ?? "");
  const [albumSlug, setAlbumSlug] = useState(album.slug);
  const [description, setDescription] = useState(album.description ?? "");
  const [visibility, setVisibility] = useState(album.visibility);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0 || albumSlug.trim().length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    setSaved(false);
    try {
      const result = await updateAlbum({
        data: {
          description: description.trim() || null,
          id: album.id,
          slug: albumSlug.trim(),
          title: title.trim(),
          visibility,
        },
      });
      if (result.success) {
        if (result.slug !== slug) {
          await router.navigate({
            params: { slug: result.slug },
            replace: true,
            to: "/admin/albums/$slug/settings",
          });
        }
        await router.invalidate();
        setSaved(true);
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md">
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="アルバムに戻る"
          renderRoot={(props) => <Link {...props} to="/admin/albums/$slug" params={{ slug }} />}
        >
          <ArrowLeftIcon size={18} />
        </ActionIcon>
        <Title order={2}>アルバムの設定</Title>
      </Group>

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
            description="公開ページのアドレスに使われます。英数字・ひらがな・カタカナ・漢字とハイフンが使えます"
            required
            value={albumSlug}
            onChange={(e) => setAlbumSlug(e.currentTarget.value)}
            maxLength={200}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              公開状態
            </Text>
            <SegmentedControl
              value={visibility}
              onChange={(v) => setVisibility(v === "public" ? "public" : "private")}
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
          <Group justify="flex-end" gap="sm">
            {saved && (
              <Text size="sm" c="dimmed">
                保存しました
              </Text>
            )}
            <Button
              type="submit"
              loading={submitting}
              disabled={title.trim().length === 0 || albumSlug.trim().length === 0}
            >
              保存する
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
};

type AlbumSettings = {
  album: {
    id: string;
    slug: string;
    title: string | null;
    description: string | null;
    visibility: "public" | "private";
  };
};

export const Route = createFileRoute("/admin/albums_/$slug/settings")({
  component: AlbumSettingsPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `設定 | ${loaderData?.album.title ?? "アルバム"}` }],
  }),
  loader: async ({ params }: { params: { slug: string } }): Promise<AlbumSettings> => {
    const { album } = await getAlbumBySlug({ data: { slug: params.slug } });
    return {
      album: {
        description: album.description,
        id: album.id,
        slug: album.slug,
        title: album.title,
        visibility: album.visibility,
      },
    };
  },
  shouldReload: true,
});
