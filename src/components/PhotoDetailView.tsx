import { useRef, useState, type ReactNode } from "react";

import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  GlobeIcon,
  LockIcon,
  SaveIcon,
  SparklesIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { PhotoLocationMap } from "#/components/PhotoLocationMap.tsx";
import { generatePhotoDraft, updatePhoto, updatePhotoVisibility } from "#/server/photos.ts";

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
  visibility: "public" | "private";
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
  albums: { id: string; slug: string; title: string | null; visibility: "public" | "private" }[];
};

type InfoRow = { label: string; value: string };

const formatDateTime = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

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
  backLink?: ReactNode;
  previousLink?: ReactNode;
  nextLink?: ReactNode;
};

export const PhotoDetailView = ({ photo, backLink, previousLink, nextLink }: Props) => {
  const router = useRouter();
  const imageSrc = `/api/i/${photo.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`;
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
  const [switching, setSwitching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dirty = caption.trim() !== (photo.caption ?? "") || alt.trim() !== (photo.alt ?? "");

  const handleVisibility = async (visibility: "private" | "public") => {
    if (switching || visibility === photo.visibility) {
      return;
    }
    setSwitching(true);
    setErrorMessage(null);
    try {
      const result = await updatePhotoVisibility({ data: { id: photo.id, visibility } });
      if (result.success) {
        await router.invalidate();
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSwitching(false);
    }
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
        setCaption(result.caption);
        setAlt(result.alt);
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

  return (
    <Stack p="xl" gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <div>{backLink}</div>
        <Group gap="xs" wrap="nowrap">
          {previousLink ?? (
            <ActionIcon variant="default" disabled aria-label="前の写真">
              <ChevronLeftIcon size={16} />
            </ActionIcon>
          )}
          {nextLink ?? (
            <ActionIcon variant="default" disabled aria-label="次の写真">
              <ChevronRightIcon size={16} />
            </ActionIcon>
          )}
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
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={500}>
              公開状態
            </Text>
            <SegmentedControl
              value={photo.visibility}
              onChange={(value) => {
                void handleVisibility(value === "public" ? "public" : "private");
              }}
              disabled={switching}
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
            <Text size="sm" c="red">
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

          {photo.latitude !== null && photo.longitude !== null && (
            <Card withBorder radius="md" padding="md">
              <Stack gap="xs">
                <Title order={4}>位置情報</Title>
                <PhotoLocationMap latitude={photo.latitude} longitude={photo.longitude} />
                {renderInfoList([
                  { label: "緯度", value: photo.latitude.toFixed(6) },
                  { label: "経度", value: photo.longitude.toFixed(6) },
                  ...(photo.altitude === null
                    ? []
                    : [{ label: "標高", value: `${photo.altitude.toFixed(1)} m` }]),
                ])}
                <Anchor
                  href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                >
                  Google Maps で開く
                </Anchor>
              </Stack>
            </Card>
          )}

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
                      {album.visibility === "public" ? (
                        <GlobeIcon size={14} color="var(--mantine-color-dimmed)" />
                      ) : (
                        <LockIcon size={14} color="var(--mantine-color-dimmed)" />
                      )}
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
