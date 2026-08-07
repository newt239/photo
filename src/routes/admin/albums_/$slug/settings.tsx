import { useState } from "react";

import {
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon, GlobeIcon, LockIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";

import { deleteAlbum, getAlbumBySlug, updateAlbum } from "#/server/albums.ts";

const AlbumSettingsPage = () => {
  const { album, photoCount } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const router = useRouter();
  const [title, setTitle] = useState(album.title ?? "");
  const [albumSlug, setAlbumSlug] = useState(album.slug);
  const [description, setDescription] = useState(album.description ?? "");
  const [visibility, setVisibility] = useState(album.visibility);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletePhotos, setDeletePhotos] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty =
    title.trim() !== (album.title ?? "") ||
    albumSlug.trim() !== album.slug ||
    description.trim() !== (album.description ?? "") ||
    visibility !== album.visibility;

  const handleDelete = async () => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    setErrorMessage(null);
    try {
      const result = await deleteAlbum({ data: { deletePhotos, id: album.id } });
      if (result.success) {
        await router.navigate({ to: "/admin/albums" });
        await router.invalidate();
      } else {
        setErrorMessage(result.error);
        closeDelete();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      closeDelete();
    } finally {
      setDeleting(false);
    }
  };

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
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={500}>
              公開状態
            </Text>
            <SegmentedControl
              value={visibility}
              onChange={(v) => setVisibility(v === "public" ? "public" : "private")}
              data={[
                {
                  label: (
                    <Group gap={6} wrap="nowrap" justify="center">
                      <LockIcon size={14} />
                      非公開
                    </Group>
                  ),
                  value: "private",
                },
                {
                  label: (
                    <Group gap={6} wrap="nowrap" justify="center">
                      <GlobeIcon size={14} />
                      公開
                    </Group>
                  ),
                  value: "public",
                },
              ]}
            />
          </Group>
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
              leftSection={<SaveIcon size={16} />}
              loading={submitting}
              disabled={!dirty || title.trim().length === 0 || albumSlug.trim().length === 0}
            >
              保存する
            </Button>
          </Group>
        </Stack>
      </form>

      <Divider my="sm" />

      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            アルバムの削除
          </Text>
          <Text size="xs" c="dimmed">
            削除したアルバムは元に戻せません
          </Text>
        </Stack>
        <Button
          color="red"
          variant="outline"
          leftSection={<Trash2Icon size={16} />}
          onClick={openDelete}
        >
          アルバムを削除する
        </Button>
      </Group>

      <Modal opened={deleteOpened} onClose={closeDelete} title="アルバムを削除する" centered>
        <Stack gap="md">
          <Text size="sm">
            「{album.title ?? "(無題)"}」を削除します。この操作は取り消せません。
          </Text>
          <Checkbox
            label={`アルバム内の写真 ${photoCount} 枚も削除する`}
            description="削除した写真は他のアルバムからも取り除かれます。チェックしない場合、写真はアルバムから外れるだけで残ります"
            checked={deletePhotos}
            disabled={photoCount === 0 || deleting}
            onChange={(e) => setDeletePhotos(e.currentTarget.checked)}
          />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              leftSection={<XIcon size={16} />}
              onClick={closeDelete}
              disabled={deleting}
            >
              キャンセルする
            </Button>
            <Button
              color="red"
              leftSection={<Trash2Icon size={16} />}
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
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
  photoCount: number;
};

export const Route = createFileRoute("/admin/albums_/$slug/settings")({
  component: AlbumSettingsPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `設定 | ${loaderData?.album.title ?? "アルバム"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { slug: string } }): Promise<AlbumSettings> => {
    const { album, photos } = await getAlbumBySlug({ data: { slug: params.slug } });
    return {
      album: {
        description: album.description,
        id: album.id,
        slug: album.slug,
        title: album.title,
        visibility: album.visibility,
      },
      photoCount: photos.length,
    };
  },
  shouldReload: true,
});
