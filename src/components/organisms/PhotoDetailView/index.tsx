import { useRef, useState, useTransition } from "react";

import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Group,
  Menu,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  ExpandIcon,
  ImageIcon,
  SaveIcon,
  SparklesIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { VisibilityIcon } from "#/components/atoms/VisibilityIcon";
import { PhotoLocationEditor } from "#/components/organisms/PhotoLocationEditor";
import { formatDateTime } from "#/lib/format.ts";
import { photoImageUrl } from "#/lib/image-url.ts";
import { setAlbumCover } from "#/server/albums.ts";
import { generatePhotoDraft } from "#/server/photo-draft.ts";
import { updatePhoto } from "#/server/photos.ts";

import classes from "./PhotoDetailView.module.css";

type PhotoDetailData = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
  takenAt: Date | string | null;
  uploadedAt: Date | string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  albums: {
    id: string;
    slug: string;
    title: string | null;
    visibility: "public" | "private";
    coverPhotoId: string | null;
  }[];
};

type InfoRow = { label: string; value: string };

const renderInfoList = (rows: InfoRow[]) => (
  <Stack gap={6}>
    {rows.map((row) => (
      <Group key={row.label} justify="space-between" gap="md" wrap="nowrap">
        <Text size="sm" c="dimmed">
          {row.label}
        </Text>
        <Text size="sm" ta="right">
          {row.value}
        </Text>
      </Group>
    ))}
  </Stack>
);

type Props = {
  photo: PhotoDetailData;
  albumSlug?: string;
  previousId: string | null;
  nextId: string | null;
};

export const PhotoDetailView = ({ photo, albumSlug, previousId, nextId }: Props) => {
  const router = useRouter();
  const imageSrc = photoImageUrl(photo.storageKey);
  const camera = [photo.cameraMake, photo.cameraModel].filter(Boolean).join(" ");
  const exifRows: InfoRow[] = [];
  if (camera) {
    exifRows.push({ label: "カメラ", value: camera });
  }
  if (photo.lensModel) {
    exifRows.push({ label: "レンズ", value: photo.lensModel });
  }
  if (photo.focalLength !== null) {
    exifRows.push({ label: "焦点距離", value: `${photo.focalLength} mm` });
  }
  if (photo.aperture !== null) {
    exifRows.push({ label: "絞り", value: `f/${photo.aperture}` });
  }
  if (photo.shutterSpeed) {
    exifRows.push({ label: "シャッター速度", value: `${photo.shutterSpeed} s` });
  }
  if (photo.iso !== null) {
    exifRows.push({ label: "ISO", value: `ISO ${photo.iso}` });
  }

  const fileSize =
    photo.fileSize < 1024
      ? `${photo.fileSize} B`
      : photo.fileSize < 1024 * 1024
        ? `${(photo.fileSize / 1024).toFixed(1)} KB`
        : `${(photo.fileSize / (1024 * 1024)).toFixed(2)} MB`;
  const fileRows: InfoRow[] = [
    { label: "サイズ", value: `${photo.width} × ${photo.height}` },
    { label: "ファイルサイズ", value: fileSize },
    { label: "形式", value: photo.mimeType },
  ];
  const takenAt = formatDateTime(photo.takenAt);
  if (takenAt) {
    fileRows.push({ label: "撮影日時", value: takenAt });
  }
  const uploaded = formatDateTime(photo.uploadedAt);
  if (uploaded) {
    fileRows.push({ label: "アップロード日時", value: uploaded });
  }

  const stageRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ left: number; top: number; x: number; y: number } | null>(null);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [alt, setAlt] = useState(photo.alt ?? "");
  const [zoom, setZoom] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settingCover, startSettingCover] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dirty = caption.trim() !== (photo.caption ?? "") || alt.trim() !== (photo.alt ?? "");
  const currentAlbum = photo.albums.find((album) => album.slug === albumSlug);
  const isCover = currentAlbum?.coverPhotoId === photo.id;

  const handleCover = (albumId: string) => {
    startSettingCover(async () => {
      setErrorMessage(null);
      try {
        const result = await setAlbumCover({ data: { albumId, photoId: photo.id } });
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

  const handleGenerate = async () => {
    if (generating) {
      return;
    }
    setGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generatePhotoDraft({ data: { id: photo.id } });
      if (result.success) {
        setCaption(result.caption ?? "");
        setAlt(result.alt ?? "");
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await updatePhoto({
        data: {
          alt: alt.trim() || null,
          caption: caption.trim() || null,
          id: photo.id,
        },
      });
      if (result.success) {
        await router.invalidate();
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const backButton =
    albumSlug === undefined ? (
      <Button
        component={Link}
        to="/admin"
        variant="subtle"
        size="xs"
        w="fit-content"
        leftSection={<ArrowLeftIcon size={14} />}
      >
        写真一覧に戻る
      </Button>
    ) : (
      <Button
        variant="subtle"
        size="xs"
        w="fit-content"
        leftSection={<ArrowLeftIcon size={14} />}
        renderRoot={(props) => (
          <Link {...props} to="/admin/albums/$slug" params={{ slug: albumSlug }} />
        )}
      >
        アルバムに戻る
      </Button>
    );

  const neighborButton = (photoId: string | null, direction: "previous" | "next") => {
    const label = direction === "previous" ? "前の写真" : "次の写真";
    const icon =
      direction === "previous" ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />;
    if (photoId === null) {
      return (
        <ActionIcon variant="default" disabled aria-label={label}>
          {icon}
        </ActionIcon>
      );
    }
    return (
      <ActionIcon
        variant="default"
        aria-label={label}
        renderRoot={(props) =>
          albumSlug === undefined ? (
            <Link {...props} to="/admin/photos/$photoId" params={{ photoId }} />
          ) : (
            <Link
              {...props}
              to="/admin/albums/$slug/photos/$photoId"
              params={{ photoId, slug: albumSlug }}
            />
          )
        }
      >
        {icon}
      </ActionIcon>
    );
  };

  return (
    <Stack p="xl" gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <div>{backButton}</div>
        <Group gap="xs" wrap="nowrap">
          {currentAlbum && (
            <Menu position="bottom-end" shadow="md" width={240}>
              <Menu.Target>
                <ActionIcon variant="default" disabled={settingCover} aria-label="この写真の操作">
                  <EllipsisIcon size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{currentAlbum.title ?? "(無題)"}</Menu.Label>
                <Menu.Item
                  leftSection={isCover ? <CheckIcon size={14} /> : <ImageIcon size={14} />}
                  disabled={isCover || settingCover}
                  onClick={() => {
                    handleCover(currentAlbum.id);
                  }}
                >
                  {isCover ? "このアルバムのカバーです" : "このアルバムのカバーにする"}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
          {neighborButton(previousId, "previous")}
          {neighborButton(nextId, "next")}
        </Group>
      </Group>

      <div className={classes.layout}>
        <div className={classes.viewer}>
          <div
            ref={stageRef}
            className={classes.stage}
            data-pannable={zoom > 1 || undefined}
            onPointerDown={(e) => {
              const stage = stageRef.current;
              if (!stage || zoom === 1 || e.pointerType !== "mouse") {
                return;
              }
              panRef.current = {
                left: stage.scrollLeft,
                top: stage.scrollTop,
                x: e.clientX,
                y: e.clientY,
              };
              stage.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const stage = stageRef.current;
              const pan = panRef.current;
              if (!stage || !pan) {
                return;
              }
              stage.scrollLeft = pan.left - (e.clientX - pan.x);
              stage.scrollTop = pan.top - (e.clientY - pan.y);
            }}
            onPointerUp={() => {
              panRef.current = null;
            }}
            onPointerCancel={() => {
              panRef.current = null;
            }}
          >
            <div
              className={classes.canvas}
              style={{ height: `${zoom * 100}%`, width: `${zoom * 100}%` }}
            >
              <img src={imageSrc} alt={alt || caption || ""} draggable={false} />
            </div>
          </div>
          <Group className={classes.toolbar} gap="xs" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <ActionIcon
                variant="default"
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.5))}
                disabled={zoom <= 1}
                aria-label="縮小する"
              >
                <ZoomOutIcon size={16} />
              </ActionIcon>
              <Text size="sm" c="dimmed" w={48} ta="center">
                {Math.round(zoom * 100)}%
              </Text>
              <ActionIcon
                variant="default"
                onClick={() => setZoom((prev) => Math.min(4, prev + 0.5))}
                disabled={zoom >= 4}
                aria-label="拡大する"
              >
                <ZoomInIcon size={16} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                onClick={() => setZoom(1)}
                disabled={zoom === 1}
                aria-label="全体を表示する"
              >
                <ExpandIcon size={16} />
              </ActionIcon>
            </Group>
            <Anchor href={imageSrc} target="_blank" rel="noopener noreferrer" size="sm">
              原寸で開く
            </Anchor>
          </Group>
        </div>

        <Stack gap="md" className={classes.side}>
          <Textarea
            label="キャプション"
            autosize
            minRows={2}
            value={caption}
            onChange={(e) => setCaption(e.currentTarget.value)}
            maxLength={2000}
          />
          <Textarea
            label="代替テキスト"
            autosize
            minRows={3}
            value={alt}
            onChange={(e) => setAlt(e.currentTarget.value)}
            maxLength={500}
          />
          {errorMessage && (
            <Text size="sm" c="red" role="alert">
              {errorMessage}
            </Text>
          )}
          <Group justify="space-between">
            <Button
              variant="light"
              leftSection={<SparklesIcon size={16} />}
              loading={generating}
              disabled={submitting}
              onClick={handleGenerate}
            >
              AIで生成する
            </Button>
            <Button
              leftSection={<SaveIcon size={16} />}
              loading={submitting}
              disabled={generating || !dirty}
              onClick={handleSubmit}
            >
              保存する
            </Button>
          </Group>

          <PhotoLocationEditor
            photoId={photo.id}
            latitude={photo.latitude}
            longitude={photo.longitude}
            altitude={photo.altitude}
          />

          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Title order={4}>ファイル情報</Title>
              {renderInfoList(fileRows)}
            </Stack>
          </Card>

          {exifRows.length > 0 && (
            <Card withBorder radius="md" padding="md">
              <Stack gap="xs">
                <Title order={4}>EXIF</Title>
                {renderInfoList(exifRows)}
              </Stack>
            </Card>
          )}

          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Title order={4}>アルバム</Title>
              {photo.albums.length === 0 ? (
                <Text size="sm" c="dimmed">
                  どのアルバムにも入っていません
                </Text>
              ) : (
                <Stack gap={6}>
                  {photo.albums.map((album) => (
                    <Group key={album.id} gap={6} wrap="nowrap">
                      <VisibilityIcon visibility={album.visibility} size={14} />
                      <Anchor
                        size="sm"
                        renderRoot={(props) => (
                          <Link {...props} to="/admin/albums/$slug" params={{ slug: album.slug }} />
                        )}
                      >
                        {album.title ?? "(無題)"}
                      </Anchor>
                    </Group>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        </Stack>
      </div>
    </Stack>
  );
};
