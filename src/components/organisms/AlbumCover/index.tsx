import { useState, useTransition } from "react";

import { Button, Group, Stack, Text } from "@mantine/core";
import { useRouter } from "@tanstack/react-router";
import { XIcon } from "lucide-react";

import { photoImageUrl } from "#/lib/image-url.ts";
import { setAlbumCover } from "#/server/albums.ts";

import classes from "./AlbumCover.module.css";

type AlbumCoverProps = {
  albumId: string;
  selected: boolean;
  photo: { storageKey: string; thumbnailKey: string | null } | null;
};

export const AlbumCover = ({ albumId, selected, photo }: AlbumCoverProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clear = () => {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const result = await setAlbumCover({ data: { albumId, photoId: null } });
        if (result.success) {
          await router.invalidate();
        } else {
          setErrorMessage(result.error);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    });
  };

  if (!photo) {
    return (
      <Text size="sm" c="dimmed">
        アルバムに写真がないためカバーはありません
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Group gap="md" align="flex-start" wrap="nowrap">
        <div className={classes.preview}>
          <img src={photoImageUrl(photo.thumbnailKey ?? photo.storageKey)} alt="" />
        </div>
        <Stack gap="xs" align="flex-start">
          <Text size="sm" c="dimmed">
            {selected
              ? "写真ページのメニューから変更できます"
              : "カバーが選ばれていないため先頭の写真が使われています"}
          </Text>
          <Button
            variant="default"
            size="xs"
            leftSection={<XIcon size={14} />}
            disabled={pending || !selected}
            onClick={clear}
          >
            カバーを解除する
          </Button>
        </Stack>
      </Group>

      {errorMessage && (
        <Text size="sm" c="red">
          {errorMessage}
        </Text>
      )}
    </Stack>
  );
};
