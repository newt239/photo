import { useEffect, useState } from "react";

import { ActionIcon, Button, Group, Modal, Text } from "@mantine/core";
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import classes from "./PhotoLightbox.module.css";

type LightboxPhoto = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
};

type PhotoLightboxProps = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export const PhotoLightbox = ({ photos, index, onClose, onIndexChange }: PhotoLightboxProps) => {
  const [zoom, setZoom] = useState(1);
  const photo = index === null ? undefined : photos[index];

  // 左右キーでの写真の切り替えを受け取るため window にイベントを登録する
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (index === null) {
        return;
      }
      let delta = 0;
      if (event.key === "ArrowLeft") {
        delta = -1;
      }
      if (event.key === "ArrowRight") {
        delta = 1;
      }
      if (delta === 0) {
        return;
      }
      setZoom(1);
      onIndexChange((index + delta + photos.length) % photos.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, photos.length, onIndexChange]);

  const handleClose = () => {
    setZoom(1);
    onClose();
  };

  return (
    <Modal
      opened={photo !== undefined}
      onClose={handleClose}
      fullScreen
      padding={0}
      withCloseButton={false}
      zIndex={2000}
      transitionProps={{ duration: 120 }}
      classNames={{ body: classes.body, content: classes.content }}
    >
      {index !== null && photo && (
        <>
          <ActionIcon
            className={classes.close}
            variant="default"
            size="lg"
            aria-label="閉じる"
            onClick={handleClose}
          >
            <XIcon size={18} />
          </ActionIcon>

          <div className={classes.stage}>
            <img
              className={classes.image}
              src={`/api/i/${photo.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
              alt={photo.alt ?? photo.caption ?? ""}
              style={
                zoom === 1
                  ? { maxHeight: "100%", maxWidth: "100%" }
                  : { height: `${zoom * 100}%`, maxWidth: "none" }
              }
            />
          </div>

          <div className={classes.footer}>
            <Text size="sm" c={photo.caption ? undefined : "dimmed"}>
              {photo.caption ?? "説明はありません"}
            </Text>
            <Group justify="space-between" gap="md" wrap="wrap">
              <Group gap="xs" wrap="nowrap">
                <Button
                  variant="default"
                  size="xs"
                  disabled={photos.length < 2}
                  leftSection={<ChevronLeftIcon size={14} />}
                  onClick={() => {
                    setZoom(1);
                    onIndexChange((index - 1 + photos.length) % photos.length);
                  }}
                >
                  前へ戻る
                </Button>
                <Text size="xs" c="dimmed">
                  {index + 1} / {photos.length}
                </Text>
                <Button
                  variant="default"
                  size="xs"
                  disabled={photos.length < 2}
                  rightSection={<ChevronRightIcon size={14} />}
                  onClick={() => {
                    setZoom(1);
                    onIndexChange((index + 1) % photos.length);
                  }}
                >
                  次へ進む
                </Button>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <ActionIcon
                  variant="default"
                  aria-label="縮小する"
                  disabled={zoom <= 1}
                  onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                >
                  <ZoomOutIcon size={16} />
                </ActionIcon>
                <Text size="xs" ta="center" w={44}>
                  {Math.round(zoom * 100)}%
                </Text>
                <ActionIcon
                  variant="default"
                  aria-label="拡大する"
                  disabled={zoom >= 4}
                  onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                >
                  <ZoomInIcon size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </div>
        </>
      )}
    </Modal>
  );
};
